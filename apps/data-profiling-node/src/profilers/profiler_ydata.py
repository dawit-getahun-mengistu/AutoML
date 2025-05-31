import pandas as pd
from ydata_profiling import ProfileReport

from src.data_utils import YDataProfilingSchema


class YDataProfiler:
    """
    YDataProfiler is a class that provides methods to profile a dataset using the YData Profiling library.
    It generates a profile report and serializes it into a JSON format.
    """

    @staticmethod
    def validate_file_name(file_name: str) -> bool:
        """
        Validate the file name to ensure it ends with .csv or .xlsx. or .parquet
        """
        return file_name.endswith((".csv", ".xlsx", ".parquet"))

    @staticmethod
    def read_file(file_path: str) -> pd.DataFrame:
        """
        Reads a file and returns a pandas DataFrame.

        Args:
            file_path (str): The path to the file.

        Returns:
            pd.DataFrame: The loaded DataFrame.
        """
        if file_path.endswith(".csv"):
            return pd.read_csv(file_path)
        elif file_path.endswith(".xlsx"):
            return pd.read_excel(file_path)
        elif file_path.endswith(".parquet"):
            return pd.read_parquet(file_path)
        else:
            raise ValueError("Unsupported file format")

    @staticmethod
    def generate_eda_html(profile: ProfileReport, file_name: str) -> str:
        """
        Generates an HTML report from the profile report.

        Args:
            profile (ProfileReport): The profile report to be converted to HTML.
            file_name (str): The name of the file to save the HTML report.

        Returns:
            str: The path to the saved HTML report.
        """
        html_file_path = f"{file_name}.html"
        profile.to_file(html_file_path)
        return html_file_path

    @staticmethod
    def generate_yprofile_report(
        dataframe: pd.DataFrame, title: str
    ) -> tuple[YDataProfilingSchema, str]:
        """
        Generates a profile report for the given dataframe.

        Args:
            dataframe (pd.DataFrame): The dataframe to be profiled.
            title (str): The title of the profile report.

        Returns:
            DataProfilingSchema: The generated profile report.
        """
        # Generate the profile report
        profile = ProfileReport(
            dataframe, title=title
        )  # minimal=True, will remove some features from the profile like correlations (which we need)

        # generate eda html report
        eda_path = YDataProfiler.generate_eda_html(profile, title)

        description = profile.get_description()

        return YDataProfilingSchema(
            analysis=description.analysis,
            table=description.table,
            correlations=description.correlations["auto"]
            if "auto" in description.correlations.keys()
            else None,
            alerts=[str(alert) for alert in description.alerts],
            samples=description.sample,
        ), eda_path
