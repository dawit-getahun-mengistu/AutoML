from typing import Optional
import pandas as pd
import logging
import re
import requests
import uuid
from io import BytesIO, StringIO

from urllib.parse import urlparse

from src.data_utils import Dataset, serialize
from src.services.s3_service import S3Service

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
        Loads a DataFrame from a URL, handling S3-style query parameters
        and ambiguous content-type headers.
        """
        logger.info(f"Loading data from URL: {url}")

        response = requests.get(url)
        response.raise_for_status()

        # 1. Extract filename without query parameters
        parsed_url = urlparse(url)
        filepath = parsed_url.path  # /datasets/.../file.csv
        filename = filepath.split("/")[-1].lower()  # file.csv

        # 2. Get content-type (fallback to empty string)
        content_type = response.headers.get("content-type", "").lower()

        # 3. Determine file type
        if filename.endswith(".csv") or "csv" in content_type:
            return pd.read_csv(StringIO(response.text))
        elif filename.endswith(".xlsx") or "excel" in content_type:
            return pd.read_excel(BytesIO(response.content))
        elif filename.endswith(".parquet") or "parquet" in content_type:
            return pd.read_parquet(BytesIO(response.content))
        else:
            # 4. Fallback: Attempt to parse content directly
            try:
                # Try CSV first (common case)
                return pd.read_csv(StringIO(response.text))
            except pd.errors.ParserError:
                try:
                    # Try Excel
                    return pd.read_excel(BytesIO(response.content))
                except Exception:
                    try:
                        # Try Parquet
                        return pd.read_parquet(BytesIO(response.content))
                    except Exception as e:
                        raise ValueError(
                            f"Unsupported file format. Failed to parse content. URL: {url}"
                        ) from e

    @staticmethod
    def profile(
        *, title: str, file_name: Optional[str] = None, url: Optional[str] = None
    ) -> tuple[dict, str]:
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
        ydata_result, eda_file_path = YDataProfiler.generate_yprofile_report(df, title)
        logger.info(f"YData Profiling Report saved to: {eda_file_path}")
        ydata_profile = serialize(ydata_result)

        return {
            "dataset_profile": dataset_profile,
            "column_profile": {
                "classification": column_classes,
                "categorical": categorical_profile,
                "numerical": numerical_profile,
            },
            "ydata_profile": ydata_profile,
        }, eda_file_path

    @staticmethod
    def profile_dataset(dataset: Dataset, s3_storage: S3Service) -> dict:
        """
        Profiles a Dataset object and returns a combined profiling report.
        """
        try:
            # file_uri = storage_service.get_presigned_url(
            #     bucket_name="datasets", object_name=dataset.file
            # )
            file_uri = s3_storage._public_object_url(key=dataset.file)
            if not file_uri:
                raise ValueError(f"Failed to get presigned URL for dataset file: {dataset.file}")
        except Exception as e:
            logger.error(f"Error loading dataset from file {dataset.file}: {e}")
            raise

        logger.info(f"Profiling dataset: {dataset.name} from {file_uri}")

        results, eda_file_path = ProfilingService.profile(
            title=dataset.name, url=file_uri, file_name=None
        )

        def sanitize_key(key: str) -> str:
            """Replace problematic characters in object keys"""
            return re.sub(r"[^a-zA-Z0-9!\-_\.\*\(\)]", "_", key)

        try:
            # save eda file to storage
            eda_file_name = sanitize_key(f"{uuid.uuid4()}_{dataset.name}")
            # storage_service.upload_file(
            #     bucket_name="datasets", object_name=eda_file_name, file_path=eda_file_path
            # )
            s3_storage.upload_single_file_from_path(
                path=eda_file_path,
                key=eda_file_name,
            )

            logger.info(f"EDA report saved to storage: {eda_file_name}")
        except Exception as e:
            logger.error(f"Error saving EDA report to storage: {e}")
            raise

        results["eda_object_name"] = eda_file_name
        return results
