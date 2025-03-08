conda init &&
while [ ! -z $CONDA_PREFIX ]; do conda deactivate; done &&
conda activate label-studio &&

python label-studio/label_studio/manage.py runserver 10053