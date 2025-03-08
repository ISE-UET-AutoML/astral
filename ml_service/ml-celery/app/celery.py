import platform
import queue
import sys, os

sys.path.append(os.path.dirname(__file__))

from celery import Celery, Task
from init_broker import is_broker_running
from init_redis import is_backend_running

from settings import config
from mq_main import redis

from settings import celery_config, config
from CustomPool.threads import TaskPool as CustomThreadPool

if not is_backend_running():
    exit()
if not is_broker_running():
    exit()

if platform.system() == "Windows":
    os.environ.setdefault("FORKED_BY_MULTIPROCESSING", "1")

app = Celery(
    "ML Service Celery",
    broker=config.BROKER,
    backend=config.REDIS_BACKEND,
    worker_pool=CustomThreadPool,
)
app.autodiscover_tasks(
    [
        "ml-celery.app.tasks.model_service",
    ]
)
app.config_from_object("ml-celery.app.settings.celery_config")
app.conf.broker_connection_retry_on_startup = True
app.conf.task_track_started = True
app.conf.worker_redirect_stdouts = False
