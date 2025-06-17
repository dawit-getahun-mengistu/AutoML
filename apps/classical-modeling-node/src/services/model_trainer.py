import requests, io
import pandas as pd
from urllib.parse import urlparse
from services.classification import train_and_select_best_classifier
from services.regression import train_and_select_best_model
from services.s3_service import S3Service

s3_service = S3Service()

def download_dataset(dataset_key: str):
    # load the dataset from the dataset_key
    file_uri = s3_service._public_object_url(key=dataset_key)
    if not file_uri:
            raise ValueError(f"Failed to get presigned URL for dataset file: {dataset_key}")
  
    response = requests.get(file_uri)
    response.raise_for_status()

    # 1. Extract filename without query parameters
    parsed_url = urlparse(file_uri)
    filepath = parsed_url.path  # /datasets/.../file.csv
    filename = filepath.split("/")[-1].lower()  # file.csv

    # 2. Get content-type (fallback to empty string)
    content_type = response.headers.get("content-type", "").lower()

    # 3. Determine file type
    if filename.endswith(".csv") or "csv" in content_type:
        return pd.read_csv(io.StringIO(response.text))
    elif filename.endswith(".xlsx") or "excel" in content_type:
        return pd.read_excel(io.BytesIO(response.content))
    elif filename.endswith(".parquet") or "parquet" in content_type:
        return pd.read_parquet(io.BytesIO(response.content))
    else:
        # 4. Fallback: Attempt to parse content directly
        try:
            # Try CSV first (common case)
            return pd.read_csv(io.StringIO(response.text))
        except pd.errors.ParserError:
            try:
                # Try Excel
                return pd.read_excel(io.BytesIO(response.content))
            except Exception:
                try:
                    # Try Parquet
                    return pd.read_parquet(io.BytesIO(response.content))
                except Exception as e:
                    raise ValueError(
                        f"Unsupported file format. Failed to parse content. URL: {file_uri}"
                    ) from e

def handle_queue_requests(task_type: str, target_column: str, dataset_key: str):
    data = download_dataset(dataset_key)

    if task_type == "classification":
        result = train_and_select_best_classifier(data, target_column)

    elif task_type == "regression":
        result = train_and_select_best_model(data, target_column)

    return result

