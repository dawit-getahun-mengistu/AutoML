import logging
import os
from SeaweedS3Client import S3Handler

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


class StorageService:
    def __init__(self):
        self.access_key = os.environ.get("SEAWEED_ACCESS_KEY", "any")
        self.secret_key = os.environ.get("SEAWEED_SECRET_KEY", "any")
        self.s3_endpoint = os.environ.get("SEAWEED_S3_ENDPOINT", "http://seaweedfs-s3:8333")

        self.s3_handler = S3Handler(
            s3_url=self.s3_endpoint, access_key=self.access_key, secret_key=self.secret_key
        )

    def list_buckets(self):
        """
        Lists all buckets in the SeaweedFS S3 storage.
        """
        try:
            buckets = self.s3_handler.get_buckets()
            logger.info(f"Buckets: {buckets}")
            return buckets
        except Exception as e:
            logger.error(f"Error listing buckets: {e}")
            raise

    def upload_file(
        self, bucket_name: str, file_path: str, object_name: str | None = None
    ) -> str | None:
        """
        Uploads a file to the specified bucket in SeaweedFS S3 storage.

        :param bucket_name: Name of the bucket to upload the file to.
        :param file_path: Path to the file to be uploaded.
        :param object_name: Optional name to assign to the uploaded object.
        """
        try:
            success, uri = self.s3_handler.upload_file(
                bucket_name=bucket_name,
                path_to_file=file_path,
                object_name=object_name or file_path.split("/")[-1],
            )
            if not success:
                raise Exception(f"Failed to upload file {file_path} to bucket {bucket_name}.")

            logger.info(f"File {file_path} uploaded to bucket {bucket_name}.")
            logger.info(f"File URI: {uri}")
            return uri
        except Exception as e:
            logger.error(f"Error uploading file {file_path} to bucket {bucket_name}: {e}")
            raise

    def get_presigned_url(
        self, bucket_name: str, object_name: str, expiration: int = 3600
    ) -> str | None:
        """
        Generates a presigned URL for accessing an object in SeaweedFS S3 storage.

        :param bucket_name: Name of the bucket containing the object.
        :param object_name: Name of the object to generate the URL for.
        :param expiration: Expiration time for the presigned URL in seconds.
        """
        try:
            url = self.s3_handler.get_presigned_download_url(
                bucket_name=bucket_name,
                object_name=object_name,
                expiration=expiration,
            )
            logger.info(f"Generated presigned URL for {object_name}: {url}")
            if not url:
                raise Exception(
                    f"Failed to generate presigned URL for {object_name} in bucket {bucket_name}."
                )
            return str(url)
        except Exception as e:
            logger.error(f"Error generating presigned URL for {object_name}: {e}")
            raise
