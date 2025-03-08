conda init &&
conda create -n automl_data_service python=3.10.14 --yes &&
while [ ! -z $CONDA_PREFIX ]; do conda deactivate; done &&
conda activate automl_data_service && 
pip install -r requirements.txt 