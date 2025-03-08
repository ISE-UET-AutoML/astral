conda init &&
conda create -n automl python=3.10.14 --yes &&
while [ ! -z $CONDA_PREFIX ]; do conda deactivate; done &&
conda activate automl &&
pip install -r requirements.txt 