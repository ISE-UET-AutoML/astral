from cProfile import label
import os
from pathlib import Path
import uuid
import pandas
import splitfolders
import shutil
import glob
from typing import Union
import gdown
from zipfile import ZipFile
from autogluon.core.utils.loaders import load_zip
from settings.config import BACKEND_HOST, ACCESS_TOKEN, REFRESH_TOKEN, DATASERVICE_HOST

import requests


def split_data(
    input_folder: Path,
    output_folder,
    ratio=(0.8, 0.1, 0.1),
    seed=1337,
    group_prefix=None,
    move=False,
):
    """
    Splits a dataset into training, validation, and testing sets.

    Parameters:
    input_folder (str): Path to the dataset folder.
    output_folder (str): Path where the split available_checkpoint will be saved.
    ratio (tuple): A tuple representing the ratio to split (train, val, test).
    seed (int): Random seed for reproducibility.
    group_prefix (int or None): Prefix of group name to split files into different groups.
    move (bool): If True, move files instead of copying.

    Returns:
    None
    """
    try:
        splitfolders.ratio(
            input_folder,
            output=output_folder,
            seed=seed,
            ratio=ratio,
            group_prefix=group_prefix,
            move=move,
        )
        print("Data splitting completed successfully.")
    except Exception as e:
        print(f"An error occurred during data splitting: {e}")


def create_csv(directory: Path, output_file: Path):
    with open(output_file, mode="w") as f:
        f.write("image,label\n")
        for path, _, files in os.walk(directory):
            for file in files:
                if file.lower().endswith((".png", ".jpg", ".jpeg")):
                    label = Path(path).name
                    f.write(f"{os.path.join(path, file)},{label}\n")


def remove_folders_except(user_dataset_path: Path, keep_folder: str):
    """
    Removes all subdirectories in the given directory except the specified folder.

    Args:
        user_dataset_path (Path): The path to the user's dataset directory.
        keep_folder (str): The name of the folder to keep.
    """
    for item in user_dataset_path.iterdir():
        if item.is_dir() and item.name != keep_folder:
            shutil.rmtree(item)
            print(f"Removed {item.name}")


def create_folder(user_dataset_path: Path):
    """
    Creates a folder in the user's dataset directory.

    Args:
        user_dataset_path (Path): The path to the user's dataset directory.
        folder_name (str): The name of the folder to create.
    """
    folder_path = user_dataset_path
    if not folder_path.exists():
        folder_path.mkdir()
        print(f"Created {user_dataset_path}")


def find_latest_model(user_model_path: str) -> Union[str, None]:
    """_summary_

    Args:
        user_model_path (str): _description_

    Returns:
        Union[str, None]: _description_
    """
    pattern = os.path.join(user_model_path, "**", "*.ckpt")
    list_of_files = glob.glob(pattern, recursive=True)
    return max(list_of_files, key=os.path.getctime) if list_of_files else None


def write_image_to_temp_file(image, temp_image_path):
    with open(temp_image_path, "wb") as buffer:
        buffer.write(image)


def model_size(user_model_path):
    pattern = os.path.join(user_model_path, "**", "*.ckpt")
    list_of_files = glob.glob(pattern, recursive=True)
    model_size = 0
    for file in list_of_files:
        model_size += os.path.getsize(file)
    return model_size


def download_dataset2(
    dataset_dir: str,
    dataset_url: str,
    method: str,
    format: str | None = None,
) -> pandas.DataFrame:
    """
    Download dataset

    Args:
        dataset_dir: local folder where the dataset is going to be stored, should be **/dataset/
        url:
        method: where to download dataset from
        format: for future use
    """
    #! Data set may come in many format, this function should be changed to handle all cases

    os.makedirs(dataset_dir, exist_ok=True)
    if method != "data_service":
        raise ValueError(f"Method {method} not supported")

    dataset_url = f"{DATASERVICE_HOST}/ls/task/{dataset_url}/export_for_training"

    res = requests.get(dataset_url)
    if res.status_code >= 300:
        raise ValueError("Error in downloading dataset")
    data = res.json()["data"]

    for data_point in data:

        for k, v in data_point.items():
            if k.startswith("data-IMG-"):
                name = uuid.uuid4().hex
                label = data_point["label"]
                os.makedirs(f"{dataset_dir}{label}", exist_ok=True)
                with open(f"{dataset_dir}{label}/{name}.jpg", "wb+") as f:
                    f.write(requests.get(v).content)
                    print("Image downloaded: ", f"{dataset_dir}{label}/{name}.jpg")
                    data_point[k] = f"{dataset_dir}{label}/{name}.jpg"

    df = pandas.DataFrame.from_dict(data)
    df.to_csv(f"{dataset_dir}train.csv", index=False)

    return df


def download_dataset(
    dataset_dir: str,
    is_zip: bool,
    request: dict,
    method: str,
    format: str | None = None,
):
    """
    Download dataset

    Args:
        dataset_dir: local folder where the dataset is going to be stored, should be **/dataset/
        is_zip: is object a folder? or a simple csv file?
        only tabular prediction task and text prediction task will have an data.csv file, other tasks will have multiple files
        url:
        method: where to download dataset from
        format: for future use
    """
    #! Data set may come in many format, this function should be changed to handle all cases

    os.makedirs(dataset_dir, exist_ok=True)
    if method == "data_service":
        return download_dataset_data_service(dataset_dir, request["dataset_url"])
    if method == "gdrive":
        return download_dataset_gdrive(dataset_dir, is_zip, request["dataset_url"])
    if method == "backend":
        return download_dataset_backend(dataset_dir, projectID=request["projectName"])
    if method == "text-backend":
        return download_dataset_backend_text(
            dataset_dir, projectID=request["projectName"]
        )
    if method == "csv-url":
        return download_dataset_csv_url(dataset_dir, request["dataset_url"])


def download_dataset_data_service(dataset_dir: str, ds_project_id: str):

    pass


def download_dataset_gdrive(dataset_dir: str, is_zip: bool, url: str):
    dataset_url = f"https://drive.google.com/uc?id={url}"
    if is_zip:
        datafile = f"{dataset_dir}/data.zip"
        if not os.path.exists(datafile):
            gdown.download(url=dataset_url, output=datafile, quiet=False)
    else:
        datafile = f"{dataset_dir}/data.csv"
        gdown.download(url=dataset_url, output=datafile, quiet=False)

    if datafile == "":
        raise ValueError("Error in downloading dataset")

    if is_zip == False:
        return datafile
    else:
        with ZipFile(Path(datafile), "r") as zip_ref:
            zip_ref.extractall(dataset_dir)

            has_root_dir = True
            root_dir: str | None = None

            for subfile in zip_ref.namelist():
                path = subfile.split("/")

                if path[0].__contains__("."):
                    has_root_dir = False
                    break
                if root_dir is None:
                    root_dir = path[0]
                elif root_dir != path[0]:
                    has_root_dir = False
                    break
            print(has_root_dir, root_dir)
            if has_root_dir and root_dir is not None:
                return f"{dataset_dir}/{root_dir}"
            else:
                return dataset_dir


def download_dataset_csv_url(dataset_dir: str, url: str):
    r = requests.get(url)
    print(f"Downloading dataset from {url}")
    if os.path.exists(f"{dataset_dir}/train.csv"):
        return dataset_dir

    with open(f"{dataset_dir}train.csv", "wb+") as fd:
        for chunk in r.iter_content(chunk_size=128):
            fd.write(chunk)
    return dataset_dir


def download_dataset_backend(dataset_dir: str, projectID: str):

    if os.path.exists(f"{dataset_dir}data_ok.txt"):  # if data is already downloaded
        return dataset_dir
    os.makedirs(dataset_dir, exist_ok=True)
    with open(f"{dataset_dir}data_ok.txt", "w+") as f:
        f.write("ok")

    dataset_url = f"{BACKEND_HOST}/projects/{projectID}/datasets"
    res = requests.get(dataset_url, cookies={"accessToken": ACCESS_TOKEN})
    if res.status_code != 200:
        raise ValueError("Error in downloading dataset")

    data = res.json()
    pages = data["pagination"]["total_page"]
    for page in range(pages):
        if page != 0:
            res = requests.get(
                dataset_url + f"?page={page+1}", cookies={"accessToken": ACCESS_TOKEN}
            )
            data = res.json()
        for label in data["labels"]:
            os.makedirs(f"{dataset_dir}{label['value']}", exist_ok=True)

        for image_file in data["files"]:
            name = f"{image_file['_id']}.jpg"
            label = image_file["label"]
            url = image_file["url"].replace("undefined", "localhost")
            try:
                with open(f"{dataset_dir}{label}/{name}", "wb+") as f:
                    f.write(
                        requests.get(url, cookies={"accessToken": ACCESS_TOKEN}).content
                    )
                print("Image downloaded: ", f"{dataset_dir}{label}/{name}")
            except Exception as e:
                print(e)

    # print(data)
    return dataset_dir


def download_dataset_backend_text(dataset_dir: str, projectID: str):
    if os.path.exists(f"{dataset_dir}data_ok.txt"):  # if data is already downloaded
        return dataset_dir
    os.makedirs(dataset_dir, exist_ok=True)
    with open(f"{dataset_dir}data_ok.txt", "w+") as f:
        f.write("ok")

    dataset_url = f"{BACKEND_HOST}/projects/{projectID}/datasets"
    res = requests.get(dataset_url, cookies={"accessToken": ACCESS_TOKEN})
    if res.status_code != 200:
        raise ValueError("Error in downloading dataset")

    data = res.json()

    cutoff = 100
    pages = data["pagination"]["total_page"]
    pages = min(pages, cutoff)

    train_data = []
    for page in range(pages):
        if page != 0:
            res = requests.get(
                dataset_url + f"?page={page+1}", cookies={"accessToken": ACCESS_TOKEN}
            )
            data = res.json()

        for image_file in data["files"]:
            # name = f"{image_file['_id']}.jpg"
            label = image_file["label"]
            text = image_file["url"]

            train_data.append({"text": text, "label": label})

    df = pandas.DataFrame.from_dict(train_data)
    df.to_csv(f"{dataset_dir}train.csv", index=False)

    # print(data)
    return dataset_dir


def download_dataset_zip_url(dataset_dir: str, url: str):
    r = requests.get(url)

    if os.path.exists(f"{dataset_dir}/data.zip"):
        return f"{dataset_dir}/data.zip"

    with open(f"{dataset_dir}/data.zip", "wb") as fd:
        for chunk in r.iter_content(chunk_size=128):
            fd.write(chunk)
    return f"{dataset_dir}/data.zip"
