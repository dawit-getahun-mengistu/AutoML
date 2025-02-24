import pandas as pd

class DatasetProfiler:
    @staticmethod
    def get_columns(dataframe: pd.DataFrame) -> int:
        """Returns the number of columns in the dataset."""
        return dataframe.shape[1]
    
    @staticmethod
    def get_num_observations(dataframe: pd.DataFrame) -> int:
        """Returns the number of observations (rows) in the dataset."""
        return dataframe.shape[0]

    @staticmethod
    def get_missing_cell_percentage(dataframe: pd.DataFrame) -> float:
        """Returns the percentage of missing values in the dataset."""
        total_cells = dataframe.size
        missing_cells = dataframe.isnull().sum().sum()
        return (missing_cells / total_cells) * 100 if total_cells > 0 else 0
    
    @staticmethod
    def get_duplicate_row_percentage(dataframe: pd.DataFrame) -> float:
        """Returns the percentage of duplicate rows in the dataset."""
        total_rows = dataframe.shape[0]
        duplicate_rows = dataframe.duplicated().sum()
        return (duplicate_rows / total_rows) * 100 if total_rows > 0 else 0

    @staticmethod
    def profile_dataset(dataframe: pd.DataFrame) -> str:
        """Generates a structured profile summary of the dataset."""
        num_columns = DatasetProfiler.get_columns(dataframe)
        num_observations = DatasetProfiler.get_num_observations(dataframe)
        missing_cell_percentage = DatasetProfiler.get_missing_cell_percentage(dataframe)
        duplicate_row_percentage = DatasetProfiler.get_duplicate_row_percentage(dataframe)

        return {
            "num_columns": num_columns,
            "num_observations": num_observations,
            "missing_cell_percentage": missing_cell_percentage,
            "duplicate_row_percentage": duplicate_row_percentage
        }