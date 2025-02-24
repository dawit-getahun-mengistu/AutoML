from typing import List
import pandas as pd
import numpy as np
from scipy.stats import zscore


class ColumnProfiler:
    @staticmethod 
    def calculate_mixed_dtype_percentage(series: pd.Series):
        '''
        Returns the ratios of data types found within a column.
        
        Args:
            series (pd.Series): The column to analyze.
        
        Returns:
            dict: A dictionary mapping data types to their percentage occurrence in the column.
        '''
        dtype_counts = series.map(lambda x: type(x).__name__).value_counts(normalize=True) * 100
        return dtype_counts.to_dict()

    @staticmethod
    def is_boolean_convertible(series: pd.Series):
        '''
        Checks if a column is convertible to boolean and returns the percentage of convertible values.
        
        Args:
            series (pd.Series): The column to analyze.
        
        Returns:
            float: The ratio of values that can be converted to boolean.
        '''
        bool_like_values = {0, 1, 'True', 'False', 'true', 'false', True, False}
        valid_count = series.dropna().map(lambda x: x in bool_like_values).sum()
        return valid_count / len(series)
    
    @staticmethod
    def classify_columns(dataframe: pd.DataFrame):
        '''
        Classifies columns into four main categories: Numeric, Categorical, DateTime, and Mixed.
        
        Args:
            dataframe (pd.DataFrame): The dataframe whose columns are to be classified.
        
        Returns:
            dict: A dictionary containing lists of column names for each category.
        '''
        classifications = {
            "numeric": dataframe.select_dtypes(include=[np.number]).columns.tolist(),
            "boolean": dataframe.select_dtypes(include=["bool"]).columns.tolist(),
            "categorical": [],
            "datetime": [],
            "mixed": []
        }
        mixed = []
        remaining_cols = set(dataframe.columns) - set(classifications["numeric"]) - set(classifications["boolean"])
        to_be_tested = []

        for col in remaining_cols:
            mixed_type_percentage = ColumnProfiler.calculate_mixed_dtype_percentage(series=dataframe[col])
            types = list(mixed_type_percentage.keys())
            if len(types) == 1:
                to_be_tested.append(col)
            elif len(types) == 2 and 'NoneType' in types:
                to_be_tested.append(col)
            else:
                mixed.append({col: mixed_type_percentage}) 

        for col in to_be_tested:
            try:
                converted = pd.to_datetime(dataframe[col], errors='coerce')
                datetime_ratio = converted.notna().mean()
            except Exception:
                datetime_ratio = 0

            if datetime_ratio > 0:
                classifications["datetime"].append(col)
                continue

            bool_ratio = ColumnProfiler.is_boolean_convertible(series=dataframe[col])
            if bool_ratio > 0.8:
                classifications['boolean'].append(col)
                continue

            unique_ratio = dataframe[col].nunique() / len(dataframe[col])
            if unique_ratio < 0.1 or dataframe[col].map(lambda x: isinstance(x, str)).sum() == len(dataframe[col]):
                classifications["categorical"].append(col)
                continue

        classifications["mixed"] = mixed
        return classifications

    @staticmethod
    def _categorical_summary(series: pd.Series) -> dict:
        '''
        Computes a summary for categorical columns including mode, missing values, and frequency distribution.
        
        Args:
            series (pd.Series): The categorical column to analyze.
        
        Returns:
            dict: A dictionary with summary statistics for the categorical column.
        '''
        mode_without_na = list(series.mode(dropna=True).value_counts().to_dict().keys())
        missing_values = int(series.isnull().sum() * 100) / series.size 
        category_counts = series.value_counts(dropna=True)
        frequency_distribution_without_na = (category_counts * 100 / series.size).to_dict()
        cardinality_without_na = len(frequency_distribution_without_na.keys())

        return {
            'mode': mode_without_na,
            'missing_values': missing_values,
            'cardinality': cardinality_without_na,
            'frequency_distribution': frequency_distribution_without_na,
            'category_counts': category_counts.to_dict()
        }

    @staticmethod
    def profile_categorical_columns(dataframe: pd.DataFrame, categorical_cols: List[str]) -> dict:
        '''
        Generates summaries for categorical columns.
        
        Args:
            dataframe (pd.DataFrame): The dataframe containing categorical columns.
            categorical_cols (List[str]): List of categorical column names.
        
        Returns:
            dict: A dictionary with summaries for each categorical column.
        '''
        return {col: ColumnProfiler._categorical_summary(series=dataframe[col]) for col in categorical_cols}
    
    @staticmethod
    def _numerical_summary(series: pd.Series) -> dict:
        '''
        Computes a summary of numerical columns, including central tendencies, variance, and distribution measures.
        
        Args:
            series (pd.Series): The numerical column to analyze.
        
        Returns:
            dict: A dictionary containing summary statistics for the numerical column.
        '''
        return {
            'mean': float(series.mean()),
            'median': float(series.median()),
            'mode': list(series.mode(dropna=True).value_counts().to_dict().keys()),
            'min': float(series.min()),
            'max': float(series.max()),
            'range': float(series.max() - series.min()),
            'variance': float(series.var()),
            'std': float(series.std()),
            'skewness': float(series.skew()),
            'kurtosis': float(series.kurtosis())
        }

    @staticmethod
    def _detect_outliers(series: pd.Series) -> dict:
        '''
        Detects outliers in a numerical column using the IQR and z-score methods.
        
        Args:
            series (pd.Series): The numerical column to analyze.
        
        Returns:
            dict: A dictionary containing outlier statistics using IQR and z-score methods.
        '''
        first_quartile, third_quartile = series.quantile([0.25, 0.75])
        iqr = third_quartile - first_quartile
        left_whisker = first_quartile - (1.5 * first_quartile)
        right_whisker = third_quartile + (1.5 * third_quartile)
        z_scores = zscore(series)

        return {
            'iqr': {
                'Q1': float(first_quartile),
                'Q3': float(third_quartile),
                'IQR': float(iqr),
                'left_outliers': int(series[series < left_whisker].count()),
                'right_outliers': int(series[series > right_whisker].count())
            },
            'z-score': {
                'left_outliers': int((z_scores < -3).sum()),
                'right_outliers': int((z_scores > 3).sum())
            }
        }

    @staticmethod
    def profile_numerical_columns(dataframe: pd.DataFrame, numerical_columns: List[str]) -> dict:
        '''
        Profiles numerical columns by computing summary statistics and outlier detection.
        
        Args:
            dataframe (pd.DataFrame): The dataframe containing numerical columns.
            numerical_columns (List[str]): List of numerical column names.
        
        Returns:
            dict: A dictionary with profiles for each numerical column.
        '''
        return {col: {'summary': ColumnProfiler._numerical_summary(dataframe[col]), 'outliers': ColumnProfiler._detect_outliers(dataframe[col])} for col in numerical_columns}

    @staticmethod
    def profile_datetime_columns(dataframe: pd.DataFrame) -> str:
        ...
