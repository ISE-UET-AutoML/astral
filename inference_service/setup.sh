pip install uv

uv pip install -r requirements.txt

uv pip install onnxruntime-gpu==1.18.0 --extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/

mkdir $1

wget -O ./$1/trained_model.zip $2

unzip ./$1/trained_model.zip -d ./

# TODO: handle port conflicts when there are multiple deployments on a single instance 

bentoml serve service:"$3"Service --port $4 > ./$1/serving_logs.txt 2>&1 &