import gc
from typing import Union
import glob
import shutil
from dataclasses import dataclass
import subprocess
import splitfolders
import time
import argparse
import pandas as pd
import logging
from autogluon.multimodal import MultiModalPredictor
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
    balanced_accuracy_score,
    matthews_corrcoef,
)
from autogluon.core.metrics import make_scorer
from pathlib import Path
import asyncio
from typing import Optional, Union
import torch
import os

torch.cuda.empty_cache()
gc.collect()

torch.set_float32_matmul_precision("medium")


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


def get_folder_size(folder_path: Path) -> str:
    return (
        subprocess.check_output(["du", "-sh", folder_path]).split()[0].decode("utf-8")
    )


@dataclass
class Timm_Checkpoint:
    swin_small_patch4_window7_224: str = "swin_small_patch4_window7_224"
    swin_base_patch4_window7_224: str = "swin_base_patch4_window7_224"
    swin_large_patch4_window7_224: str = "swin_large_patch4_window7_224"
    swin_large_patch4_window12_384: str = "swin_large_patch4_window12_384"


class AutogluonTrainer(object):
    def __init__(self, kwargs: Optional[dict] = None):
        self.fit_args = None
        self.model_args = None
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)

        self.parse_args(kwargs)

    def parse_args(self, kwargs: Optional[dict] = None):
        if kwargs is None:
            return
        self.model_args = kwargs.setdefault("ag_model_args", {})
        self.fit_args = kwargs.setdefault(
            "ag_fit_args",
            {
                "time_limit": kwargs.get("time_limit", 60 * 2),
                "hyperparameters": {
                    "env.precision": "bf16-mixed",
                    "env.per_gpu_batch_size": 4,
                    "env.batch_size": 4,
                    "optimization.efficient_finetune": "lora",
                    "optimization.log_every_n_steps": 2,
                    "env.num_workers_evaluation": os.cpu_count() - 1,
                    "model.timm_image.checkpoint_name": Timm_Checkpoint.swin_small_patch4_window7_224,
                },
            },
        )

    def train(
        self, label: str, train_data_path: Path, val_data_path: Path, model_path: Path
    ) -> Union[MultiModalPredictor, None]:
        try:
            if model_path.exists():
                shutil.rmtree(model_path)

            predictor = MultiModalPredictor(
                label=label, path=str(model_path), **self.model_args
            )
            print("created predictor")

            logging.basicConfig(level=logging.DEBUG)

            predictor.fit(
                train_data=str(train_data_path),
                tuning_data=str(val_data_path),
                save_path=str(model_path),
                **self.fit_args,
            )

            print(predictor.eval_metric)

            self._logger.info(f"Training completed. Model saved to {model_path}")
            return predictor
        except ValueError as ve:
            self._logger.error(f"Value Error: {ve}")

        except FileNotFoundError as fnfe:
            self._logger.error(f"File Not Found Error: {fnfe}")

        except Exception as e:
            self._logger.error(f"An unexpected error occurred: {e}")

        return None

    async def train_async(
        self, label: str, train_data_path: Path, val_data_path: Path, model_path: Path
    ) -> Union[MultiModalPredictor, None]:
        return await asyncio.to_thread(
            self.train, label, train_data_path, val_data_path, model_path
        )

    @staticmethod
    def evaluate(
        predictor: MultiModalPredictor, test_data_path: Path
    ) -> Optional[float]:
        try:

            from sklearn.preprocessing import label_binarize, LabelEncoder

            df = pd.read_csv(test_data_path)

            df = pd.DataFrame(df["image"])

            output_path = test_data_path.parent / "output"

            os.system(f"mkdir -p {output_path}")

            output_path = Path(output_path)

            test_res: dict = {}

            predictor.predict(df).to_csv(output_path / "predictions.csv", index=False)

            y_pred = pd.read_csv(output_path / "predictions.csv")["label"]

            y_true = pd.read_csv(test_data_path)["label"]

            test_res["accuracy"] = accuracy_score(y_true, y_pred)

            test_res["balanced_accuracy"] = balanced_accuracy_score(y_true, y_pred)

            test_res["mcc"] = matthews_corrcoef(y_true, y_pred)

            test_res["roc_auc"] = roc_auc_score(y_true, y_pred, average="weighted")

            average = "binary" if predictor.problem_type == "binary" else "weighted"

            test_res["f1_score"] = f1_score(y_true, y_pred, average=average)

            test_res["precision"] = precision_score(y_true, y_pred, average=average)
            test_res["recall"] = recall_score(y_true, y_pred, average=average)

            return test_res

        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None


from autogluon.multimodal import MultiModalPredictor
import sys

if __name__ == "__main__":
    try:

        predictor = MultiModalPredictor.load(
            "/home/automl/AutoML-Platform/src/mlservice/app/image_classifier/model"
        )

        print(
            AutogluonTrainer.evaluate(
                predictor,
                "/home/automl/AutoML-Platform/src/mlservice/app/image_classifier/data/test.csv",
            )
        )

        sys.exit(1)
        start = time.perf_counter()
        parser = argparse.ArgumentParser()
        parser.add_argument("--data-path", type=str, required=True)
        parser.add_argument("--training-time", type=int, default=60 * 2)
        parser.add_argument(
            "--backbone-model", type=str, default="swin_small_patch4_window7_224"
        )
        parser.add_argument("--model-path", type=str, default="model")
        parser.add_argument("--target", type=str, default="label")
        parser.add_argument("--train-ratio", type=float, default=0.8)
        parser.add_argument("--val-ratio", type=float, default=0.1)
        parser.add_argument("--test-ratio", type=float, default=0.1)

        args = parser.parse_args()

        data_path = Path(args.data_path)

        split_data(
            data_path,
            data_path / "split",
            ratio=(args.train_ratio, args.val_ratio, args.test_ratio),
        )
        create_csv(data_path, data_path / "train.csv")
        create_csv(data_path, data_path / "val.csv")
        create_csv(data_path, data_path / "test.csv")

        trainer = AutogluonTrainer({"time_limit": args.training_time})
        model = trainer.train(
            args.target,
            data_path / "train.csv",
            data_path / "val.csv",
            Path(args.model_path),
        )

        end = time.perf_counter()

        if model is not None:
            test_acc = trainer.evaluate(model, data_path / "test.csv")
            print(f"Test accuracy: {test_acc}")
        else:
            print("Model training failed.")

        print(f"Time taken: {end - start:.2f} seconds")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
