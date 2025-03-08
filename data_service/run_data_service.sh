conda init &&
while [ ! -z $CONDA_PREFIX ]; do conda deactivate; done &&
conda activate automl_data_service &&

python src/main.py