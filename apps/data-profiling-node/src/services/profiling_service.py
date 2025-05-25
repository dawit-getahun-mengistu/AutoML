from typing import Optional
import pandas as pd
import logging
import requests
from io import BytesIO, StringIO

from src.profilers.data_set_profiling import DatasetProfiler
from src.profilers.column_profiling import ColumnProfiler
from src.profilers.profiler_ydata import YDataProfiler

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


class ProfilingService:
    """
    Service to load a dataset from a URL and generate a combined profiling report
    using DatasetProfiler, ColumnProfiler, and YDataProfiler.
    """

    @staticmethod
    def load_dataframe_from_file(file_path: str) -> pd.DataFrame:
        """
        Loads a DataFrame from a given file path. Supports CSV, XLSX, and Parquet files.
        """
        if file_path.endswith(".csv"):
            return pd.read_csv(file_path)
        elif file_path.endswith(".xlsx"):
            return pd.read_excel(file_path)
        elif file_path.endswith(".parquet"):
            return pd.read_parquet(file_path)
        else:
            raise ValueError("Unsupported file format: " + file_path)

    @staticmethod
    def load_dataframe_from_url(url: str) -> pd.DataFrame:
        """
        Loads a DataFrame from a given URL. Supports CSV, XLSX, and Parquet files.
        """
        response = requests.get(url)
        response.raise_for_status()
        if url.endswith(".csv"):
            return pd.read_csv(StringIO(response.text))
        elif url.endswith(".xlsx"):
            return pd.read_excel(BytesIO(response.content))
        elif url.endswith(".parquet"):
            return pd.read_parquet(BytesIO(response.content))
        else:
            raise ValueError("Unsupported file format for URL: " + url)

    @staticmethod
    def profile(*, title: str, file_name: Optional[str] = None, url: Optional[str] = None) -> dict:
        """
        Loads the dataset from the URL and returns a combined profiling report.
        """
        if not (file_name or url):
            raise ValueError("Either file_name or url must be provided.")
        if file_name:
            df = ProfilingService.load_dataframe_from_file(file_name)
        elif url:
            df = ProfilingService.load_dataframe_from_url(url)
        else:
            raise ValueError("No valid file or URL provided.")

        # Dataset-level profiling
        dataset_profile = DatasetProfiler.profile_dataset(df)

        # Column-level profiling
        column_classes = ColumnProfiler.classify_columns(df)
        categorical_profile = ColumnProfiler.profile_categorical_columns(
            df, column_classes.get("categorical", [])
        )
        logging.info(f"Categorical Profile: {categorical_profile}")

        numerical_profile = ColumnProfiler.profile_numerical_columns(
            df, column_classes.get("numeric", [])
        )
        # Optional: adding datetime and mixed profiling as needed

        # YData profiling
        ydata_profile = YDataProfiler.generate_yprofile_report(df, title)

        return {
            "dataset_profile": dataset_profile,
            "column_profile": {
                "classification": column_classes,
                "categorical": categorical_profile,
                "numerical": numerical_profile,
            },
            "ydata_profile": ydata_profile,
        }
