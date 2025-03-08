# Use the specified PyTorch image with CUDA
FROM pytorch/pytorch:2.1.2-cuda12.1-cudnn8-devel

# Set up environment variables for Python
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set up environment variables for data service and backend URLs
ARG DATASERVICE_URL
ARG BACKEND_URL

# Install required system packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    software-properties-common \
    git \
    wget \
    unzip \
    nano \
    zip \
    libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*

# Copy requirement file and install dependencies
COPY requirements.txt /workspace/requirements.txt
RUN pip install -r /workspace/requirements.txt

# Set working directory
WORKDIR /workspace

# Copy local files to the container (e.g., preprocess.py, train.py)
COPY . /workspace/

# Download dataset from the specified S3 URL and unzip it
RUN mkdir -p /workspace/dataset && \
    wget -O /workspace/dataset/training_data.zip "${DATASERVICE_URL}" && \
    unzip /workspace/dataset/training_data.zip -d /workspace/dataset

# Run preprocessing script
RUN python3 preprocess.py --data-path "/workspace/dataset"

# Define build arguments for training and presets
ARG TRAINING_TIME
ARG PRESETS
ARG DATASET_URL

ARG MODEL_PATH

ARG MODEL_CONFIG

# Run the training script
RUN python3 train.py --training-time "${TRAINING_TIME}" --presets "${PRESETS}" --dataset-url "${DATASET_URL}"

# Zip the model for upload
RUN zip "${MODEL_PATH}" /workspace/model/metadata.json /workspace/model/model.onnx

RUN python3 postprocess.py --model-path "${MODEL_PATH}" --save-model-config "${MODEL_CONFIG}"

# Final command to keep container alive or run further tasks as needed
CMD ["bash"]
