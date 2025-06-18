from urllib.parse import urlparse
import uuid
import matplotlib
import requests

from services.s3_service import S3Service

matplotlib.use("Agg")

import io, logging, json
import pandas as pd
import matplotlib.pyplot as plt
from featurewiz import featurewiz
from contextlib import redirect_stdout
from agents.agent import page_generator

s3_service = S3Service()

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


def generate_summary(context: dict):
    summary = page_generator.invoke(
        {
            "learned_parameters": json.dumps(context, indent=2),
        }
    )
    summary = summary.replace("`", "").replace("html", "")
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

    with open("files/summary.html", "w") as file:
        file.write(resulting_page)


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


def extract_data_from_figure(fig):
    """
    Inspects a Matplotlib Figure object and extracts numerical data from its axes.

    This function iterates through each Axes in the figure and attempts to pull
    data from Line2D (line plots), Rectangle (bar plots), and PathCollection
    (scatter plots) artists.

    Args:
        fig (matplotlib.figure.Figure): The figure object to inspect.

    Returns:
        list: A list of dictionaries, where each dictionary represents one
              Axes and contains the extracted data and metadata.
    """
    extracted_data = []
    # A figure can have multiple subplots (Axes)
    for i, ax in enumerate(fig.get_axes()):
        axis_data = {
            "axis_index": i,
            "title": ax.get_title(),
            "xlabel": ax.get_xlabel(),
            "ylabel": ax.get_ylabel(),
            "lines": [],
            "bars": [],
            "scatter": [],
        }

        # 1. Extract data from line plots (Line2D objects)
        for line in ax.lines:
            axis_data["lines"].append(
                {
                    "label": line.get_label(),
                    "x_data": str(line.get_xdata()),
                    "y_data": str(line.get_ydata()),
                }
            )

        # 2. Extract data from bar plots (Rectangle patches)
        # We check for BarContainer to be more specific, but iterating patches works
        for patch in ax.patches:
            # This check helps ignore non-bar rectangles like the axis frame
            if isinstance(patch, plt.Rectangle):
                axis_data["bars"].append(
                    {
                        "x_coord": str(patch.get_x()),
                        "y_coord": str(patch.get_y()),
                        "width": str(patch.get_width()),
                        "height": str(patch.get_height()),
                    }
                )

        # 3. Extract data from scatter plots (PathCollection objects)
        for collection in ax.collections:
            # get_offsets() returns an (N, 2) array of (x, y) coordinates
            offsets = collection.get_offsets()
            axis_data["scatter"].append({"x_data": offsets[:, 0], "y_data": offsets[:, 1]})

        extracted_data.append(axis_data)

    return extracted_data


def select_features(data: pd.DataFrame, target: str):
    """
    Runs featurewiz and captures its console logs and ALL generated plots
    without opening any GUI windows.
    """
    log_stream = io.StringIO()

    with redirect_stdout(log_stream):
        selected_features, new_df = featurewiz(
            dataname=data,
            target=target,
            corr_limit=0.70,
            verbose=2,
            header=True,
            test_data="",
            feature_engg="",
            category_encoders="",
        )

    # Get the integer identifiers for all open figures
    figure_numbers = plt.get_fignums()

    # Retrieve the actual figure objects and store them in a list
    captured_figures = [plt.figure(num) for num in figure_numbers]

    # Close all figures to free up memory
    figure_data = []
    for fig in captured_figures:
        figure_data.extend(extract_data_from_figure(fig))
        plt.close(fig)

    capture_logs = log_stream.getvalue()

    return {
        "selected_features": selected_features,
        "logs": capture_logs,
        # "plot_figures": captured_figures,
        "figure_data": json.dumps(figure_data),
    }


def process_feature_selection_from_queue(dataset_key: str, target_column: str):
    """
    Process feature selection from a dataset stored in S3.
    """
    try:
        # Download the dataset
        data = download_dataset(dataset_key)

        logger.info(f"\n\n {target_column} \n\n")

        # Ensure the target column exists
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Run feature selection
        result = select_features(data, target_column)

        # select the features of the dataset
        transformed_data = data[result["selected_features"] + [target_column]]

        # save the transformed data to the files directory
        with open("files/transformed_data.csv", "w") as f:
            transformed_data.to_csv(f, index=False)

        # upload the dataset to S3
        name = str(uuid.uuid4())
        with open("files/transformed_data.csv", "rb") as f:
            upload_result = s3_service.upload_single_file(
                file_obj=f, filename=f"{name}.csv", content_type="text/csv", key=name
            )

        # generate summary
        generate_summary(
            {
                "selected_features": result["selected_features"],
                "logs": result["logs"],
            }
        )

        # Upload the summary data to S3
        with open("files/summary.html", "rb") as f:
            upload_summary_result = s3_service.upload_single_file(
                file_obj=f,
                filename=f"{name}_summary.html",
                content_type="text/html",
                key=f"{name}_summary",
            )

        logger.info(f"Uploading transformed data with name: {name}")
        result["transformed_data"] = upload_result["key"]
        result["summary"] = upload_summary_result["key"]

        # Upload the results to S3 or return them as needed
        return result
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        raise e


def process_feature_selection_from_api(dataset: pd.DataFrame, target_column: str):
    """
    Process feature selection from a dataset provided as a DataFrame.
    """
    try:
        # Ensure the target column exists
        if target_column not in dataset.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Run feature selection
        result = select_features(dataset, target_column)

        # select the features of the dataset
        transformed_data = dataset[result["selected_features"] + [target_column]]

        # save the transformed data to files director
        with open("files/transformed_data.csv", "w") as f:
            transformed_data.to_csv(f, index=False)

        # upload the dataset to S3
        name = str(uuid.uuid4())
        with open("files/transformed_data.csv", "rb") as f:
            upload_result = s3_service.upload_single_file(
                file_obj=f, filename=f"{name}.csv", content_type="text/csv", key=name
            )

        # generate summary
        generate_summary(
            {
                "selected_features": result["selected_features"],
                "logs": result["logs"],
            }
        )

        # Upload the summary data to S3
        with open("files/summary.html", "rb") as f:
            upload_summary_result = s3_service.upload_single_file(
                file_obj=f,
                filename=f"{name}_summary.html",
                content_type="text/html",
                key=f"{name}_summary",
            )

        logger.info(f"Uploading transformed data with name: {name}")
        result["transformed_data"] = upload_result["key"]
        result["summary"] = upload_summary_result["key"]

        return result
    except Exception as e:
        logger.error(f"Error processing feature selection: {e}")
        raise e
