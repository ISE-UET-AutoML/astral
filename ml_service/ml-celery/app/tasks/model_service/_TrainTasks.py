from math import e
from celery import Task
import celery
import celery.exceptions
from cv2 import exp
from settings.config import BACKEND_HOST, ACCESS_TOKEN
import requests


class BaseTrainTask(Task):
    def before_start(self, task_id, args, kwargs):
        if self.request.delivery_info.get("redelivered"):
            print("Task was redelivered")
            raise celery.exceptions.Reject("Task was redilivered")

    def on_success(self, retval, task_id, args, kwargs):
        """
        retval – The return value of the task.
        task_id – Unique id of the executed task.
        args – Original arguments for the executed task.
        kwargs – Original keyword arguments for the executed task.
        """
        experiment_name = task_id
        if retval is not None and "saved_model_path" in retval:
            res = requests.get(
                f"{BACKEND_HOST}/experiments/deploy/?experiment_name={experiment_name}&experiment_status=DONE",
                cookies={"accessToken": ACCESS_TOKEN},
            )
            print(res.text)
        else: # currently used for deploy tasks to avoid redeliver after done
            print("Task is done")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        exc – The exception raised by the task.
        task_id – Unique id of the failed task.
        args – Original arguments for the task that failed.
        kwargs – Original keyword arguments for the task that failed.
        """
        print("Task failed")
        print(exc)
        print(task_id)
        print(args)
        print(kwargs)
        print(einfo)
        print("Task failed")
        res = requests.post(
            f"{BACKEND_HOST}/experiments/deploy/?experiment_name={task_id}&experiment_status=FAILED",
            cookies={"accessToken": ACCESS_TOKEN},
        )
        print(res.text)
        return "Task failed"
