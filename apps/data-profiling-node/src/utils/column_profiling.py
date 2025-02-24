from typing import List
import pandas as pd
import numpy as np
from scipy.stats import chi2_contingency, skew, kurtosis, zscore



class ColumnProfiler:
    @staticmethod 
    def calculate_mixed_dtype_percentage(series: pd.Series):
        '''Returns the ratios of data types found within a column'''
        dtype_counts = series.map(lambda x: type(x).__name__).value_counts(normalize=True) * 100
        return dtype_counts.to_dict()

    @staticmethod
    def is_boolean_convertible(series:pd.Series):
        """Checks if a column is convertible to boolean and returns the percentage of convertible values."""
        bool_like_values = {0, 1, 'True', 'False', 'true', 'false', True, False}
        valid_count = series.dropna().map(lambda x: x in bool_like_values).sum()
        return valid_count / len(series)
    
    @staticmethod
    def classify_columns(dataframe: pd.DataFrame):
        '''
        This classifies columns into 4 main categories of data. Numeric, Categorical, DateTime and Mixed
        Args:
            dataframe(pd.DataFrame): The dataframe whose columns are going to be calssified.
        Returns
        ----------
        A dictionary with the following keys: numeric, categorical, datetime, mixed
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
                mixed.append({
                    col: mixed_type_percentage
                }) 

        for col in to_be_tested:
            # Try converting to datetime
            try:
                converted = pd.to_datetime(dataframe[col], errors='coerce')
                datetime_ratio = converted.notna().mean()
            except Exception:
                datetime_ratio = 0

            # If most values convert successfully, classify as datetime
            if datetime_ratio > 0:
                classifications["datetime"].append(col)
                continue

            # Try converting to boolean
            bool_ration = ColumnProfiler.is_boolean_convertible(series=dataframe[col])
            if bool_ration > 0.8:
                classifications['boolean'].append(col)
                continue

            # Check for categorical (low unique ratio or all strings)
            unique_ratio = dataframe[col].nunique() / len(dataframe[col])
            if unique_ratio < 0.1 or dataframe[col].map(lambda x: isinstance(x, str)).sum() == len(dataframe[col]):
                classifications["categorical"].append(col)
                continue

        classifications["mixed"] = mixed

        return classifications

    @staticmethod
    def _categorical_summary(series: pd.Series) -> dict:
        # calculate the mode of the column
        mode_without_na = list(series.mode(dropna=True).value_counts().to_dict().keys())

        # calculate the missing values of the column
        missing_values = int(series.isnull().sum() * 100) / series.size 

        # calculate the frequency and frequency distribution of each category
        category_counts = series.value_counts(dropna=True)
        frequency_distribution_without_na = ((category_counts) * 100 / series.size).to_dict()

        # calculate the cardinality, i.e the num of categories, of the column
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
        result = {}
        for col in categorical_cols:
            summary = ColumnProfiler._categorical_summary(series=dataframe[col])
            result[col] = summary

        return result
    
    @staticmethod
    def _numerical_summary(series: pd.Series) -> dict:
        # claculate central tendencies
        mean = series.mean()
        median = series.median()
        mode = list(series.mode(dropna=True).value_counts().to_dict().keys())

        # calculate the min, max and range
        min = series.min()
        max = series.max()
        range = max - min

        # calculate variance and standard deviation
        standard_deviation = series.std()
        variance = series.var()

        # calculate the skewness and kurtosis
        skewness = series.skew()
        kurtosis = series.kurtosis()

        return {
            'mean': float(mean),
            'median': float(median),
            'mode': mode,
            'min': float(min),
            'max': float(max),
            'range': float(range),
            'variance': float(variance),
            'std': float(standard_deviation),
            'skewness': float(skewness),
            'kurtosis': float(kurtosis)
        }

    @staticmethod
    def _detect_outliers(series: pd.Series) -> dict:
        ## detect outliers using IQR method
        first_quartile = series.quantile(q=0.25)
        third_quartile = series.quantile(q=0.75)
        iqr = third_quartile - first_quartile

        # determine the left and right whiskers, min and max, to detect outliers
        left_whisker = first_quartile - (1.5 * first_quartile)
        right_whisker = third_quartile + (1.5 * third_quartile)

        # detect outliers to the left
        left_count = series[series < left_whisker].count()

        # detect outliers to the right
        right_count = series[series > right_whisker].count()

        ## detect outliers using z-score method
        # calculate the z-scores of the datapoints
        z_scores = (series - series.mean()) / series.std()

        # count values with z-scores greater than 3
        z_counts_left = z_scores[z_scores < -3].count()

        # count values with z-scores less than -3
        z_counts_right = z_scores[z_scores > 3].count()

        return {
            'iqr': {
                'Q1': float(first_quartile),
                'Q3': float(third_quartile),
                'IQR': float(iqr),
                'left_whisker': float(left_whisker),
                'right_whisker': float(right_whisker),
                'left_outliers': int(left_count),
                'right_outliers': int(right_count)
            },
            'z-score': {
                'left_outliers': int(z_counts_left),
                'right_outliers': int(z_counts_right)
            }
        }

    @staticmethod
    def _correlation_matrix(dataframe: pd.DataFrame, num_cols: list) -> dict:
        if len(num_cols) < 2: return {'no_cor': 'Only one numerical columns present, no correlation analysis needed.'}

        # select the numerical columns from the dataframe
        numerical = dataframe[num_cols]

        # calcaute the correlation between the numerical columns
        correlation = numerical.corr().to_dict()

        return correlation

    @staticmethod
    def profile_numerical_columns(dataframe: pd.DataFrame, numerical_columns: List[str]) -> dict:
        result = {}
        for col in numerical_columns:
            # get the numerical summary
            numerical_summary = ColumnProfiler._numerical_summary(series=dataframe[col])

            # get the outlier detection summary
            outlier_detection = ColumnProfiler._detect_outliers(series=dataframe[col])

            # missing value analysis
            # calculate the missing values of the column
            missing_values = int(dataframe[col].isnull().sum() * 100) / dataframe[col].size 

            result[col] = {
                'numerical_sum': numerical_summary,
                'outlier_det': outlier_detection,
                'missing_values': missing_values 
                }

        correlation_analysis = ColumnProfiler._correlation_matrix(dataframe=dataframe, num_cols=numerical_columns)

        if 'no_cor' in correlation_analysis.keys():
            result['correlation_analysis'] = correlation_analysis['no_cor']
        else:
            result['correlation_analysis'] = correlation_analysis

        return result

    @staticmethod
    def profile_datetime_columns(dataframe: pd.DataFrame) -> str:
        ...
