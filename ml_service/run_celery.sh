conda init &&
conda activate automl &&
celery -A ml-celery.app.celery worker --loglevel=info --concurrency=1 
