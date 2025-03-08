import os
import zipfile


def unzip_file(zip_path, extract_to='.'):
    """
    Unzip a file to a specified folder.

    :param zip_path: Path to the .zip file
    :param extract_to: Destination directory to extract the files. Defaults to the current directory.
    """
    # Ensure the destination directory exists
    if not os.path.exists(extract_to):
        os.makedirs(extract_to)

    # Unzip the file
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
        print(f"Unzipped files to {extract_to}")
