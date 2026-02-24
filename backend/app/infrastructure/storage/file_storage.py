"""File storage abstraction layer.

Provides an abstract interface and concrete implementations for persisting
binary file content (uploads, documents, etc.).
"""

import abc
import os
from pathlib import Path

import aiofiles


class FileStorage(abc.ABC):
    """Abstract base class that all storage backends must implement."""

    @abc.abstractmethod
    async def save(
        self, file_content: bytes, filename: str, subfolder: str = ""
    ) -> str:
        """Persist *file_content* and return the stored path / key."""
        ...

    @abc.abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Remove the file at *file_path*.  Return ``True`` on success."""
        ...

    @abc.abstractmethod
    async def get(self, file_path: str) -> bytes:
        """Read and return the raw bytes for the file at *file_path*."""
        ...


# --------------------------------------------------------------------------- #
# Local filesystem implementation
# --------------------------------------------------------------------------- #


class LocalFileStorage(FileStorage):
    """Store files on the local filesystem under *upload_dir*."""

    def __init__(self, upload_dir: str) -> None:
        self.upload_dir = upload_dir

    async def save(
        self, file_content: bytes, filename: str, subfolder: str = ""
    ) -> str:
        """Write *file_content* to ``<upload_dir>/<subfolder>/<filename>``.

        Creates intermediate directories if they do not exist.
        Returns the full path to the saved file.
        """
        directory = Path(self.upload_dir) / subfolder if subfolder else Path(self.upload_dir)
        directory.mkdir(parents=True, exist_ok=True)

        file_path = directory / filename
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)

        return str(file_path)

    async def delete(self, file_path: str) -> bool:
        """Delete the file at *file_path* from local disk.

        Returns ``True`` if the file was removed, ``False`` if it did not exist.
        """
        try:
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False

    async def get(self, file_path: str) -> bytes:
        """Read the entire file at *file_path* and return its bytes.

        Raises ``FileNotFoundError`` if the file does not exist.
        """
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()


# --------------------------------------------------------------------------- #
# S3 implementation (stub)
# --------------------------------------------------------------------------- #


class S3FileStorage(FileStorage):
    """Store files in an AWS S3 bucket.

    .. note::

       This is a **stub** implementation.  Replace the ``TODO`` bodies with
       real ``boto3`` / ``aioboto3`` calls when S3 integration is needed.
    """

    def __init__(self, bucket_name: str, region: str = "us-east-1") -> None:
        self.bucket_name = bucket_name
        self.region = region
        # TODO: Initialise an aioboto3 session / S3 client here.
        #   import aioboto3
        #   self._session = aioboto3.Session()

    async def save(
        self, file_content: bytes, filename: str, subfolder: str = ""
    ) -> str:
        """Upload *file_content* to S3 and return the object key.

        TODO: Implement using aioboto3::

            key = f"{subfolder}/{filename}" if subfolder else filename
            async with self._session.client("s3", region_name=self.region) as client:
                await client.put_object(
                    Bucket=self.bucket_name, Key=key, Body=file_content
                )
            return key
        """
        raise NotImplementedError("S3FileStorage.save is not yet implemented")

    async def delete(self, file_path: str) -> bool:
        """Delete the object at *file_path* (S3 key) from the bucket.

        TODO: Implement using aioboto3::

            async with self._session.client("s3", region_name=self.region) as client:
                await client.delete_object(Bucket=self.bucket_name, Key=file_path)
            return True
        """
        raise NotImplementedError("S3FileStorage.delete is not yet implemented")

    async def get(self, file_path: str) -> bytes:
        """Download the object at *file_path* (S3 key) and return raw bytes.

        TODO: Implement using aioboto3::

            async with self._session.client("s3", region_name=self.region) as client:
                response = await client.get_object(
                    Bucket=self.bucket_name, Key=file_path
                )
                return await response["Body"].read()
        """
        raise NotImplementedError("S3FileStorage.get is not yet implemented")
