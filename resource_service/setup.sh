python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt

cd app/terraforms/aws
terraform init
# terraform apply -auto-approve

cd ../gcp
terraform init
# terraform apply -auto-approve

cd ../../..

deactivate

