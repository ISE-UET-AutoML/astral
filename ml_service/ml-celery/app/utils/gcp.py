import time
from pathlib import Path
from typing import *
from typing import Any

from google.cloud.storage import Client, Bucket, transfer_manager

from settings import config

from dataclasses import dataclass

import asyncio
import logging


class SingletonMeta(type):
    """
    The Singleton class can be implemented in different ways in Python. Some
    possible methods include: base class, decorator, metaclass. We will use the
    metaclass because it is best suited for this purpose.
    """

    _instances = {}

    def __call__(cls, *args, **kwargs):
        """
        Possible changes to the value of the `__init__` argument do not affect
        the returned instance.
        """
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]


@dataclass
class Storage(metaclass=SingletonMeta):
    _initialized = False

    storage_client: Client = None

    def __init__(self):
        try:
            if not self._initialized:
                print("Initializing storage client...")
                start = time.time()
                print("init service account")
                self.storage_client = Client.from_service_account_json(
                    config.GCP_CREDENTIALS
                )
                # self.storage_client = Client.create_anonymous_client()
                print(
                    "Storage client initialized in "
                    + str(time.time() - start)
                    + " seconds"
                )
                self._initialized = True

        except Exception as error:
            print("Error when initializing storage client: ", error)
            # exit(1)
        finally:
            pass

    def create_bucket(self, bucket_name: str) -> Bucket:
        """Create a new bucket in specific location with storage class"""
        try:
            new_bucket: Bucket = self.storage_client.create_bucket(bucket_name)
            print("Bucket {} created".format(new_bucket.path))
            return new_bucket
        except Exception as error:
            print("Error in creating bucket: ", error)

    async def create_bucket_async(self, bucket_name: str) -> Bucket:
        """Create a new bucket in specific location with storage class"""
        try:
            return await asyncio.to_thread(self.create_bucket, bucket_name)
        except Exception as error:
            logging.error(f"Async create bucket error: {error}")
            raise

    def list_buckets(self) -> List[Bucket]:
        """Lists all buckets."""
        try:
            buckets = self.storage_client.list_buckets()
            return [bucket for bucket in buckets]
        except Exception as error:
            print("Error in listing buckets: ", error)
            return []

    async def list_buckets_async(self) -> List[Bucket]:
        """Lists all buckets."""
        try:
            return await asyncio.to_thread(self.list_buckets)
        except Exception as error:
            logging.error(f"Async list buckets error: {error}")
            raise

    def delete_bucket(self, bucket_name: str) -> bool:
        bucket = self.storage_client.bucket(bucket_name)
        """Deletes a bucket. even if not empty."""
        try:
            bucket.delete(force=True)
            print("Bucket {} deleted".format(bucket.name))
            return True
        except Exception as error:
            blobs = bucket.list_blobs()
            for blob in blobs:
                blob.delete()
            bucket.delete()
            print("Bucket {} deleted".format(bucket_name))
            return True

    def get_bucket(self, bucket_name: str) -> Union[Bucket, None]:
        """Retrieves a bucket if it exists"""
        try:
            return self.storage_client.get_bucket(bucket_name)
        except Exception as error:
            print("Error in getting bucket: ", error)
            return None

    def upload_blob(
        self, bucket_name: str, source_file_name: Path, destination_blob_name: Path
    ) -> bool:
        """Uploads a single file to the bucket.
        Vi du upload_blob("user1_bucket", "available_checkpoint/flowers/file_1", "flowers/des_1")
        """
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_filename(source_file_name)
            print(
                "File {} uploaded to {}.".format(
                    source_file_name, destination_blob_name
                )
            )
            return True
        except Exception as error:
            print("Error in uploading blob: ", error)
            return False

    async def upload_blob_async(
        self, bucket_name: str, source_file_name: Path, destination_blob_name: Path
    ) -> bool:
        """Uploads a single file to the bucket.
        Vi du upload_blob("user1_bucket", "available_checkpoint/flowers/file_1", "flowers/des_1")
        """
        try:
            return await asyncio.to_thread(
                self.upload_blob, bucket_name, source_file_name, destination_blob_name
            )
        except Exception as error:
            logging.error(f"Async upload blob error: {error}")
            raise

    def upload_blob_from_string(
        self, bucket_name: str, source_string: str, destination_blob_name: Path
    ) -> bool:
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_string(source_string)
            return True
        except Exception as error:
            print("Error in uploading blob: ", error)
        return False

    async def upload_blob_from_string_async(
        self, bucket_name: str, source_string: str, destination_blob_name: Path
    ) -> bool:
        try:
            return await asyncio.to_thread(
                self.upload_blob_from_string,
                bucket_name,
                source_string,
                destination_blob_name,
            )
        except Exception as error:
            logging.error(f"Async upload blob from string error: {error}")
            raise

    def create_folder(self, bucket_name: str, folder_name: str) -> bool:
        try:
            start = time.time()
            bucket = self.storage_client.bucket(bucket_name)
            print("Get bucket in " + str(time.time() - start) + " seconds")

            if not folder_name.endswith("/"):
                folder_name += "/"
            blob = bucket.blob(folder_name)
            blob.upload_from_string("")
            return True
        except Exception as error:
            print(f"Error in creating folder: {type(error).__name__}: {error}")
        return False

    def upload_from_folder(
        self,
        bucket_name,
        source_directory: Path,
        destination_prefix: str,
        max_workers: int = 10,
    ) -> list | None:
        try:
            bucket = self.storage_client.bucket(bucket_name)
            directory_as_path_obj = Path(source_directory)
            paths = directory_as_path_obj.rglob("*")
            file_paths = [path for path in paths if path.is_file()]
            relative_paths = [path.relative_to(
                source_directory) for path in file_paths]
            string_paths = [str(path) for path in relative_paths]
            print(f"Uploading {len(string_paths)}")
            results = transfer_manager.upload_many_from_filenames(
                bucket,
                string_paths,
                source_directory=str(source_directory),
                blob_name_prefix=(
                    destination_prefix
                    if destination_prefix.endswith("/")
                    else destination_prefix + "/"
                ),
                max_workers=max_workers,
                additional_blob_attributes={"cache_control": "public"},
            )
            return results
        except Exception as error:
            print("Error in uploading from folder: ", error)
            return None

    async def upload_from_folder_async(
        self,
        bucket_name,
        source_directory: Path,
        destination_prefix: str,
        max_workers: int = 10,
    ) -> list | None:
        try:
            return await asyncio.to_thread(
                self.upload_from_folder,
                bucket_name,
                source_directory,
                destination_prefix,
                max_workers,
            )
        except Exception as error:
            logging.error(f"Async upload from folder error: {error}")
            raise

    def download_blob(
        self, bucket_name: str, source_blob_name: Path, destination_file_name: Path
    ) -> bool:
        """Downloads a blob from the bucket."""
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(source_blob_name)
            blob.download_to_filename(destination_file_name)
            print(
                "Blob {} downloaded to {}.".format(
                    source_blob_name, destination_file_name
                )
            )
            return True
        except Exception as error:
            print("Error in downloading blob: ", error)
            return False

    async def download_blob_async(
        self,
        bucket_name: Union[str, str],
        source_blob_name: Union[Path, str],
        destination_file_name: Path,
    ) -> bool:
        """Downloads a blob from the bucket."""
        try:
            return await asyncio.to_thread(
                self.download_blob, bucket_name, source_blob_name, destination_file_name
            )
        except Exception as error:
            logging.error(f"Async download blob error: {error}")
            raise

    def download_folder(
        self,
        bucket_name,
        source_directory="flower/",
        destination_directory="",
        workers=30,
    ):
        try:
            print("download folder source_directory", source_directory)
            bucket = self.storage_client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=source_directory)
            blobs = [blob for blob in blobs]

            blob_names = [blob.name for blob in blobs]
            print(f"Downloading {len(blob_names)}")
            results = transfer_manager.download_many_to_path(
                bucket,
                blob_names,
                destination_directory=destination_directory,
                max_workers=workers,
            )
            return results
        except Exception as error:
            print("Error in downloading folder: ", error)
            return None

    # asyncio trick to wrap around the sync function
    async def download_folder_async(
        self,
        bucket_name,
        source_directory="flower/",
        destination_directory="",
        workers=30,
    ):
        try:
            return await asyncio.to_thread(
                self.download_folder,
                bucket_name,
                source_directory,
                destination_directory,
                workers,
            )
        except Exception as error:
            logging.error(f"Async download error: {error}")
            raise

    def list_blobs(self, bucket_name: str, prefix: str = None) -> List[Any]:
        """Lists all the blobs in the bucket. prefix will be append at the end of the bucket name -> folder"""
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blobs = bucket.list_blobs(
                prefix=prefix, additional_blob_attributes={
                    "cache_control": "public"}
            )
            return [blob for blob in blobs]
        except Exception as error:
            print("Error in listing blobs: ", error)
            return []

    def delete_folder(self, bucket_name: str, folder_name: str) -> bool:
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=folder_name)
            for blob in blobs:
                blob.delete()
            return True
        except Exception as error:
            print("Error in deleting folder: ", error)
            return False


if __name__ == "__main__":
    storage = Storage()
