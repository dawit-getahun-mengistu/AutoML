import os
from typing import Optional
import uuid
import logging
import mimetypes
from urllib.parse import quote

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class S3Service:
    def __init__(self):
        self.bucket_name = os.environ.get("S3_BUCKET_NAME")
        region = os.environ.get("AWS_REGION")
        access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
        secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

        if not all([self.bucket_name, region, access_key_id, secret_access_key]):
            raise EnvironmentError("Missing required AWS environment variables.")

        self.s3 = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
        )

    def upload_single_file(
        self,
        file_obj,
        filename: str,
        content_type: str,
        *,
        is_public: bool = True,
        key: Optional[str] = None,
    ):
        if not key:
            key = str(uuid.uuid4())
        acl = "public-read" if is_public else "private"

        try:
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_obj,
                ContentType=content_type,
                ACL=acl,
                Metadata={"originalName": filename},
            )

            url = self._public_object_url(key) if is_public else self._presigned_url(key)

            return {"url": url, "key": key, "is_public": is_public}

        except (BotoCoreError, ClientError) as exc:
            logger.error("S3 upload failed: %s", exc)
            raise exc

    def upload_single_file_from_path(
        self, path: str, is_public: bool = True, key: Optional[str] = None
    ):
        if not os.path.isfile(path):
            raise FileNotFoundError(f"No such file: {path}")

        filename = os.path.basename(path)
        content_type, _ = mimetypes.guess_type(filename)
        content_type = content_type or "application/octet-stream"

        with open(path, "rb") as f:
            return self.upload_single_file(
                file_obj=f,
                filename=filename,
                content_type=content_type,
                is_public=is_public,
                key=key,
            )

    def _public_object_url(self, key: str) -> str:
        return f"https://{self.bucket_name}.s3.amazonaws.com/{quote(key)}"

    def _presigned_url(self, key: str, expires_in: int = 3600) -> str:
        try:
            return self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": key},
                ExpiresIn=expires_in,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error("Presigned URL generation failed: %s", exc)
            raise exc

    def delete_file(self, key: str) -> dict:
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=key)
            return {"message": "File deleted successfully"}
        except (BotoCoreError, ClientError) as exc:
            logger.error("S3 delete failed: %s", exc)
            raise exc
