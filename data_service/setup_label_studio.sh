# Clone repository
# cd ..
# git clone https://github.com/HumanSignal/label-studio --branch 1.13.1 
# Create virtual enviroment
conda init &&
conda create -n label-studio python=3.10.14 --yes &&
while [ ! -z $CONDA_PREFIX ]; do conda deactivate; done &&
conda activate label-studio &&

# Install all package dependencies
pip install poetry &&
cd label-studio &&
poetry config keyring.enabled false &&
poetry install &&
# Run database migrations
python label_studio/manage.py migrate &&
python label_studio/manage.py collectstatic 
# Start the server in development mode at http://localhost:8080
# python label_studio/manage.py runserver 8673 &&
#                                       port
