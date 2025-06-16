import json
import os
import pickle
import uuid
from typing import Any, Dict

import numpy as np
import optuna
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import ElasticNet, Lasso, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR

# Suppress Optuna's verbose logging for each trial
optuna.logging.set_verbosity(optuna.logging.WARNING)


def train_and_select_best_model(
    df: pd.DataFrame, target_column: str, n_trials: int = 50
) -> Dict[str, Any]:
    """
    Trains, optimizes with Optuna, and selects the best regression model.

    This function performs the following steps:
    1.  Separates features (X) and target (y).
    2.  Splits the data into training and testing sets.
    3.  Defines a list of models to train.
    4.  For each model, it uses Optuna to find the best hyperparameters by
        maximizing the cross-validated R-squared score on the training data.
    5.  Retrains the model with the best hyperparameters on the full training set.
    6.  Evaluates the final model on the held-out test set.
    7.  Selects the best overall model based on the test set R-squared score.
    8.  Saves the best model object to a .pkl file with a unique ID.
    9.  Saves a detailed JSON report of all model results.

    Args:
        df (pd.DataFrame): The cleaned and prepped input DataFrame.
        target_column (str): The name of the target variable column.
        n_trials (int): The number of optimization trials for Optuna to run
                        for each model.

    Returns:
        Dict[str, Any]: A dictionary containing the performance statistics of
                        all models and information about the best one.
    """
    # --- 0. Setup ---
    if not os.path.exists("files"):
        os.makedirs("files")
        print("Created directory: 'files/'")

    # --- 1. Obtain X and y ---
    print(f"Separating features and target ('{target_column}')...")
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not in DataFrame.")
    X = df.drop(columns=[target_column])
    y = df[target_column]

    # --- 2. Split data into train and test sets ---
    print("Splitting data into training and testing sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # --- 3. Define Model Mappings and Objective Functions ---

    # ROBUST: Map string names to actual model classes to avoid globals()
    MODELS_MAPPING = {
        "Ridge": Ridge,
        "Lasso": Lasso,
        "ElasticNet": ElasticNet,
        "KNeighborsRegressor": KNeighborsRegressor,
        "RandomForestRegressor": RandomForestRegressor,
        "GradientBoostingRegressor": GradientBoostingRegressor,
        "XGBoostRegressor": xgb.XGBRegressor,
    }

    def get_objective(model_name, X, y):
        """Returns a tailored Optuna objective function for a given model."""

        def objective(trial):
            # Select model class from the robust mapping
            model_class = MODELS_MAPPING[model_name]

            if model_name == "Ridge":
                params = {"alpha": trial.suggest_float("alpha", 1e-3, 100.0, log=True)}
            elif model_name == "Lasso":
                params = {"alpha": trial.suggest_float("alpha", 1e-3, 10.0, log=True)}
            elif model_name == "ElasticNet":
                params = {
                    "alpha": trial.suggest_float("alpha", 1e-3, 10.0, log=True),
                    "l1_ratio": trial.suggest_float("l1_ratio", 0.0, 1.0),
                }
            elif model_name == "KNeighborsRegressor":
                params = {
                    "n_neighbors": trial.suggest_int("n_neighbors", 3, 30),
                    "weights": trial.suggest_categorical("weights", ["uniform", "distance"]),
                    "p": trial.suggest_categorical("p", [1, 2]),
                }
            elif model_name == "SVR":
                params = {
                    "C": trial.suggest_float("C", 0.1, 1000, log=True),
                    "gamma": trial.suggest_float("gamma", 1e-4, 1e-1, log=True),
                    "kernel": trial.suggest_categorical("kernel", ["rbf", "poly"]),
                }
            elif model_name == "RandomForestRegressor":
                params = {
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "max_depth": trial.suggest_int("max_depth", 5, 50),
                    "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
                    "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
                    "random_state": 42,
                }
            elif model_name == "GradientBoostingRegressor":
                params = {
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
                    "max_depth": trial.suggest_int("max_depth", 3, 15),
                    "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                    "random_state": 42,
                }
            elif model_name == "XGBoostRegressor":
                params = {
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
                    "max_depth": trial.suggest_int("max_depth", 3, 15),
                    "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                    "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
                    "random_state": 42,
                }
            else:
                raise ValueError(f"Model {model_name} not recognized.")

            model = model_class(**params)
            score = cross_val_score(model, X, y, cv=5, scoring="r2", n_jobs=-1)
            return score.mean()

        return objective

    # --- 4. Loop Through Models, Optimize, and Evaluate ---
    all_models_stats = []
    best_estimators = {}

    for model_name in MODELS_MAPPING.keys():
        print(f"\n--- Optimizing {model_name} with Optuna ---")

        objective_func = get_objective(model_name, X_train, y_train)
        study = optuna.create_study(direction="maximize")
        study.optimize(objective_func, n_trials=n_trials)

        best_params = study.best_params
        print(f"Best CV R²: {study.best_value:.4f}")
        print(f"Best hyperparameters: {best_params}")

        # FIXED: Instantiate the final model using the robust mapping
        model_class = MODELS_MAPPING[model_name]
        final_model = model_class(**best_params)
        final_model.fit(X_train, y_train)
        best_estimators[model_name] = final_model

        y_pred = final_model.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        print(f"Test Set R² for {model_name}: {r2:.4f}")

        model_stats = {
            "model_name": model_name,
            "best_hyperparameters": best_params,
            "cross_validation_r2": study.best_value,
            "test_set_performance": {
                "r_squared": r2,
                "mean_squared_error": mse,
                "mean_absolute_error": mae,
            },
        }
        all_models_stats.append(model_stats)

    # --- 5. Select the best model ---
    print("\n--- Selecting best model based on Test R² score ---")
    best_model_stats = max(
        all_models_stats, key=lambda x: x["test_set_performance"]["r_squared"]
    )
    best_model_name = best_model_stats["model_name"]
    best_model_object = best_estimators[best_model_name]

    print(f"Best model selected: {best_model_name}")
    print(f"Best Test R² score: {best_model_stats['test_set_performance']['r_squared']:.4f}")

    # --- 6. Save Best Model and Final Report ---
    model_uuid = str(uuid.uuid4())
    model_path = os.path.join("files", f"{model_uuid}.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model_object, f)
    print(f"Best model saved to: {model_path}")

    final_report = {
        "best_model_info": {
            "model_name": best_model_name,
            "model_uuid": model_uuid,
            "saved_model_path": model_path,
            "test_set_performance": best_model_stats["test_set_performance"],
            "best_hyperparameters": best_model_stats["best_hyperparameters"],
        },
        "all_models_performance": all_models_stats,
    }

    stats_path = os.path.join("files", "stats.json")
    with open(stats_path, "w") as f:
        json.dump(final_report, f, indent=4)
    print(f"Full performance report saved to: {stats_path}")

    return final_report


if __name__ == "__main__":
    # --- Example Usage ---
    # Create a sample regression dataset for demonstration
    sample_df = pd.read_csv("./transformed_data.csv")

    print("\nDataset created with shape:", sample_df.shape)
    print("Head of the dataset:")
    print(sample_df.head())

    # Run the main function
    print("\nStarting the model training and selection process...")
    final_stats = train_and_select_best_model(
        df=sample_df, target_column="quality"
    )

    # You can now work with the returned dictionary
    print("\n--- Function execution finished ---")
    print(
        "Best model was:",
        final_stats["best_model_info"]["model_name"],
    )

    # Example of how to load the model back
    saved_model_path = final_stats["best_model_info"]["saved_model_path"]
    try:
        with open(saved_model_path, "rb") as f:
            loaded_model = pickle.load(f)
        print(f"\nSuccessfully loaded model from {saved_model_path}")
        print("Loaded model object:", loaded_model)
    except FileNotFoundError:
        print(f"Could not find the model file at {saved_model_path}")