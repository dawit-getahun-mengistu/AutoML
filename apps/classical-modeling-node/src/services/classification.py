import json
import os
import pickle
import uuid
from typing import Any, Dict

import optuna
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC

# Suppress Optuna's verbose logging for each trial
optuna.logging.set_verbosity(optuna.logging.WARNING)


def train_and_select_best_classifier(
    df: pd.DataFrame, target_column: str, n_trials: int = 50
) -> Dict[str, Any]:
    """
    Trains, robustly optimizes with Optuna, and selects the best multiclass
    classifier.

    Args:
        df (pd.DataFrame): The cleaned and prepped input DataFrame.
        target_column (str): The name of the target variable column.
        n_trials (int): The number of optimization trials for Optuna to run.

    Returns:
        Dict[str, Any]: A dictionary with detailed results.
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
    y_raw = df[target_column]

    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    num_classes = len(le.classes_)
    print(f"Target variable encoded into {num_classes} classes.")

    # --- 2. Stratified Split ---
    print("Performing stratified split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # --- 3. Define Model Mappings and Robust Objective Functions ---
    MODELS_MAPPING = {
        "LogisticRegression": LogisticRegression,
        "KNeighborsClassifier": KNeighborsClassifier,
        "RandomForestClassifier": RandomForestClassifier,
        "GradientBoostingClassifier": GradientBoostingClassifier,
        "XGBClassifier": xgb.XGBClassifier,
    }

    def get_objective(model_name, X, y):
        def objective(trial):
            model_class = MODELS_MAPPING[model_name]

            if model_name == "LogisticRegression":
                solver = trial.suggest_categorical("solver", ["saga", "lbfgs"])
                if solver == "saga":
                    penalty = trial.suggest_categorical("penalty", ["l1", "l2", "elasticnet"])
                else:
                    penalty = "l2"
                params = {
                    "solver": solver,
                    "penalty": penalty,
                    "C": trial.suggest_float("C", 1e-3, 1e3, log=True),
                    "max_iter": 4000,
                }
                if penalty == "elasticnet":
                    params["l1_ratio"] = trial.suggest_float("l1_ratio", 0, 1)
            elif model_name == "KNeighborsClassifier":
                params = {
                    "n_neighbors": trial.suggest_int("n_neighbors", 3, 30),
                    "weights": trial.suggest_categorical("weights", ["uniform", "distance"]),
                    "p": trial.suggest_categorical("p", [1, 2]),
                }
            elif model_name == "SVC":
                kernel = trial.suggest_categorical("kernel", ["rbf", "poly", "sigmoid"])
                params = {
                    "kernel": kernel,
                    "C": trial.suggest_float("C", 0.1, 1000, log=True),
                    "gamma": trial.suggest_float("gamma", 1e-4, 1e-1, log=True),
                    "probability": True,
                }
                if kernel == "poly":
                    params["degree"] = trial.suggest_int("degree", 2, 5)
            elif model_name == "RandomForestClassifier":
                params = {
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "max_depth": trial.suggest_int("max_depth", 5, 50),
                    "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
                    "criterion": trial.suggest_categorical("criterion", ["gini", "entropy"]),
                    "random_state": 42,
                }
            elif model_name == "GradientBoostingClassifier":
                params = {
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
                    "max_depth": trial.suggest_int("max_depth", 3, 15),
                    "random_state": 42,
                }
            elif model_name == "XGBClassifier":
                params = {
                    "objective": "multi:softmax",
                    "num_class": num_classes,
                    "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
                    "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
                    "max_depth": trial.suggest_int("max_depth", 3, 15),
                    "random_state": 42,
                }
            else:
                raise ValueError(f"Model {model_name} not recognized.")

            model = model_class(**params)
            score = cross_val_score(model, X, y, cv=5, scoring="f1_weighted", n_jobs=-1)
            return score.mean()

        return objective

    # --- 4. Loop, Optimize, and Evaluate ---
    all_models_stats = []
    best_estimators = {}

    for model_name in MODELS_MAPPING.keys():
        print(f"\n--- Optimizing {model_name} with Optuna ---")
        objective_func = get_objective(model_name, X_train, y_train)
        study = optuna.create_study(direction="maximize")
        study.optimize(objective_func, n_trials=n_trials)

        best_params = study.best_params
        print(f"Best CV Weighted F1-Score: {study.best_value:.4f}")
        print(f"Best hyperparameters: {best_params}")

        model_class = MODELS_MAPPING[model_name]
        final_model = model_class(**best_params)
        final_model.fit(X_train, y_train)
        best_estimators[model_name] = final_model

        y_pred = final_model.predict(X_test)
        # --- UPDATED SECTION ---
        f1 = f1_score(y_test, y_pred, average="weighted")
        acc = accuracy_score(y_test, y_pred) # Explicitly calculate accuracy
        report = classification_report(y_test, y_pred, target_names=le.classes_.astype(str), output_dict=True)
        
        print(f"Test Set Accuracy for {model_name}: {acc:.4f}")
        print(f"Test Set Weighted F1-Score for {model_name}: {f1:.4f}")

        model_stats = {
            "model_name": model_name,
            "best_hyperparameters": best_params,
            "cross_validation_f1_score": study.best_value,
            "test_set_performance": {
                "accuracy": acc, # Add accuracy to the report
                "weighted_f1_score": f1,
                "full_classification_report": report,
            },
        }
        all_models_stats.append(model_stats)

    # --- 5. Select and Save Best Model ---
    print("\n--- Selecting best model based on Test Weighted F1-Score ---")
    best_model_stats = max(
        all_models_stats, key=lambda x: x["test_set_performance"]["weighted_f1_score"]
    )
    best_model_name = best_model_stats["model_name"]
    best_model_object = best_estimators[best_model_name]

    print(f"Best model selected: {best_model_name}")
    print(f"Best Test Accuracy: {best_model_stats['test_set_performance']['accuracy']:.4f}")
    print(f"Best Test F1-Score: {best_model_stats['test_set_performance']['weighted_f1_score']:.4f}")

    model_uuid = str(uuid.uuid4())
    model_path = os.path.join("files", f"{model_uuid}.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model_object, f)
    print(f"Best model saved to: {model_path}")

    # --- 6. Save Final Report ---
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
    # --- Example Usage with a standard, reliable dataset ---
    from sklearn.datasets import load_iris

    print("Loading Iris dataset for a robust demonstration...")
    iris = load_iris()
    sample_df = pd.DataFrame(data=iris.data, columns=iris.feature_names)
    sample_df["target"] = iris.target_names[iris.target]

    print("\nDataset created with shape:", sample_df.shape)
    print("Class distribution:\n", sample_df["target"].value_counts())

    # Run the main function with fewer trials for a quick demo
    print("\nStarting the classifier training and selection process...")
    final_stats = train_and_select_best_classifier(
        df=sample_df, target_column="target", n_trials=15
    )

    print("\n--- Function execution finished ---")
    print("Best classifier was:", final_stats["best_model_info"]["model_name"])