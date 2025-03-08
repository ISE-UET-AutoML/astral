import logging
import os
from pathlib import Path
import asyncio
import subprocess
import argparse
from typing import Optional, Union
from autogluon.tabular import TabularPredictor
from mim import train
import pandas as pd
from autogluon.tabular.configs.hyperparameter_configs import get_hyperparameter_config
import requests
import time
from sklearn.utils import shuffle
from sklearn.model_selection import train_test_split


start = time.time()


class AutogluonTrainer(object):
    def __init__(self, kwargs: Optional[dict] = None):
        self.fit_args = None
        self.model_args = None
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)
        self.data_args = None
        self.has_special_types = None
        self.parse_args(kwargs)

    def parse_args(self, kwargs: Optional[dict] = None):
        if kwargs is None:
            kwargs = {}
        self.data_args = kwargs.setdefault(
            "data_args",
            {
                "image_cols": [],
                "text_cols": [],
            },
        )
        self.model_args = kwargs.setdefault("ag_model_args", {})
        self.has_special_types = (
            len(self.data_args["image_cols"]) + len(self.data_args["text_cols"]) > 0
        )
        self.fit_args = kwargs.setdefault(
            "ag_fit_args",
            {
                "time_limit": 500 if not self.has_special_types else 1000,
                "presets": "best_quality",
                "hyperparameters": get_hyperparameter_config(
                    "light" if not self.has_special_types else "multimodal"
                ),
            },
        )
        # self.fit_args["presets"] = "best_quality"
        self.fit_args["hyperparameters"] = get_hyperparameter_config(
            "light" if not self.has_special_types else "multimodal"
        )
        #'presets': 'best_quality',
        #'hyperparameters': get_hyperparameter_config('light' if not self.has_special_types else 'multimodal'),

    def train(
        self,
        label: str,
        train_data_path: Path,
        val_data_size: float | None,
        val_data_path: Path | None,
        problem_type: str | None,
        model_path: Path,
    ) -> Union[TabularPredictor, None]:
        try:
            train_df = pd.read_csv(train_data_path)

            print("autogluon trainer: read data successfully")
            feature_metadata = "infer"
            if self.has_special_types:
                from autogluon.tabular import FeatureMetadata

                feature_metadata = FeatureMetadata.from_df(train_df)
                feature_metadata = feature_metadata.add_special_types(
                    {col: ["image_path"] for col in self.data_args["image_cols"]}
                )
                feature_metadata = feature_metadata.add_special_types(
                    {col: ["text"] for col in self.data_args["text_cols"]}
                )

            print("autogluon trainer: feature metadata successfully")
            predictor = TabularPredictor(
                label=label,
                path=str(model_path),
                problem_type=problem_type,
                eval_metric="acc",
                **self.model_args,
            )
            print("autogluon trainer: create predictor successfully")
            # logging.basicConfig(level=logging.DEBUG)
            # split train and validation
            train_df, val_df = train_test_split(train_df, test_size=val_data_size)

            predictor.fit(
                train_data=train_df,
                tuning_data=val_df,
                use_bag_holdout=True,
                feature_metadata=feature_metadata,
                **self.fit_args,
            )
            print("autogluon trainer: fit successfully")

            # acc=history.get('validation_performance')
            # loss=history.get('validation_loss')
            

            print(predictor.eval_metric)
            
            metadata = {
                "labels": predictor.class_labels.tolist(),
            }
            with open(f"{model_path}/metadata.json", "w") as f:
                json.dump(metadata, f, sort_keys=True, indent=4, ensure_ascii=False)
            
            # save sample data for data distribution
            train_df.drop(columns=["label"]).sample(n=100).to_csv(f"{model_path}/sample_data.csv", index=False)
            
            
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
        self,
        label: str,
        train_data_path: Path,
        val_data_size: float | None,
        val_data_path: Path | None,
        model_path: Path,
    ) -> Union[TabularPredictor, None]:
        return await asyncio.to_thread(
            self.train, label, train_data_path, val_data_size, val_data_path, model_path
        )

    @staticmethod
    def evaluate(
        predictor: TabularPredictor, test_data_path: Path
    ) -> Union[dict, None]:
        try:
            test_data_path = pd.read_csv(test_data_path)
            test_acc = predictor.evaluate(test_data_path)
            return test_acc
        except Exception as e:
            logging.error(f"An unexpected error occurred: {e}")
            return None


if __name__ == "__main__":
    DATA_CENTER_URL = os.environ.get("DATA_CENTER")
    BUCKET_NAME = os.environ.get("BUCKET_NAME")
    PROJECT_NAME = os.environ.get("PROJECT_NAME")
    try:
        parser = argparse.ArgumentParser()
        # parser.add_argument("--data-path", type=str,
        #                    required=True, help="Path to training data")
        parser.add_argument(
            "--target", type=str, default="Survived", help="Name of the target column"
        )

        parser.add_argument("--train-time", type=int, default=180, help="Training time")

        parser.add_argument(
            "--model-path", type=str, default="models", help="Path to save model"
        )

        # parser.add_argument("--test-path", type=str, default="",
        #                     help="Path to test data")

        parser.add_argument(
            "--test-size", type=float, default=0.2, help="Size of the test dataset"
        )

        args = parser.parse_args()

        if DATA_CENTER_URL is None:
            raise Exception("Data Center URL is not provided")

        train_data = args.data_path

        autogluon = AutogluonTrainer()

        p = autogluon.train(args.target, train_data, None, args.model_path)

        response = {
            "Algorithm": "AutoGluon",
        }
        if p is not None:
            response.update(autogluon.evaluate(p, args.data_path))

        response.update({"Time to train": time.time() - start})

        requests.post(f"{DATA_CENTER_URL}", json=response)

        subprocess.run(
            [
                "aws",
                "s3",
                "cp",
                args.model_path,
                f"s3://{BUCKET_NAME}/{PROJECT_NAME}/models/",
                "--recursive",
            ]
        )
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")

        requests.post(f"{DATA_CENTER_URL}", json={"error": f"{e}"})
