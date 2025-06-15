from io import BytesIO, StringIO
from urllib.parse import urlparse
import pandas as pd
import logging, json

import requests
from agents.feature_engineer.agent import feature_engineer
from agents.predict_feature_creator.agent import predict_feature_creator
from agents.summarizer.agent import page_generator
from services.storage_service import StorageService
from services.s3_service import S3Service

s3_service = S3Service()

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

def process_feature_engineering(csv_data: pd.DataFrame, profiling_data: dict, target_column: str, task: str):
    # invode the agent to process the feature engineering
    feature_engineering_result = feature_engineer.invoke({
        "data": csv_data,
        "profiling": profiling_data,
        "target_column": target_column,
        "task_type": task
    })
    feature_engineering_code = feature_engineering_result["code"]
    resulting_data, learned_parameters = feature_engineering_result["result"]
    
    # invoke the agent to predict the feature creation
    test_data = csv_data.head(3)
    prediction_result = predict_feature_creator.invoke({
        "code": feature_engineering_code,
        "data": test_data,
        "task_type": task,
        "learned_params": learned_parameters
    })

    # save the codes to files
    with open("files/feature_engineering_code.py", "w") as f:
        f.write(feature_engineering_code)
    with open("files/feature_transformation_code.py", "w") as f:
        f.write(prediction_result["code"])

    # save the resulting data to a csv file
    resulting_data.to_csv("files/resulting_data.csv", index=False)

    # save the learned parameters to a json file
    with open("files/learned_parameters.json", "w") as f:
        import json
        json.dump(learned_parameters, f)
    
    # invoke the summarizer agent to generate a page
    summary = page_generator.invoke({
        "learned_parameters": learned_parameters,
    })
    summary = summary.replace("`", "").replace("html", "")

    # load the Jinja2 template
    resulting_page = f"""
    <!DOCTYPE html>
<html lang="en">
  <head>
    <title>Declarative Report with Bootstrap & Tailwind</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- 1. CSS Frameworks -->
    <!-- Bootstrap CSS for components -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
      crossorigin="anonymous"
    />
    <!-- Tailwind CSS for utility-first styling -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- 2. JavaScript Libraries -->
    <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  </head>

  <body class="bg-gray-100 text-gray-800 font-sans leading-relaxed">
    {summary}
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"
    ></script>
  </body>
</html>

    """

    # save the rendered template to a file
    with open("files/summary.html", "w", encoding="utf-8") as f:
        f.write(resulting_page)

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
                        f"Unsupported file format. Failed to parse content. URL: {file_uri}"
                    ) from e

def process_feature_engineering_from_queue(
        dataset_key:str,
        profiling: str,
        task_type: str,
        target_column: str,
):
    try:
        # load the dataset from the dataset_key
        csv_data = download_dataset(dataset_key)
        logger.info("Dataset loaded successfully.")

        # load the profiling data from the json_key
        profiling_data = json.loads(profiling)
        logger.info("Profiling data loaded successfully.")

        # now profile the dataset
        process_feature_engineering(csv_data, profiling_data, target_column, task_type)

    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return

