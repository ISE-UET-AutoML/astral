# Data Service Repository

This project provides a robust data service for handling various datasets efficiently.

## Requirements

Before you begin, ensure you have met the following requirements:

- **Python 3.10**: 3.10.14 is recommended.
- **pip**: Python package manager.


run sh file with ```source name.sh```

## Install label-studio for local development

```bash
# Clone repository
git clone https://github.com/HumanSignal/label-studio --branch 1.13.1 
# Create virtual enviroment

# Install all package dependencies
pip install poetry
poetry install
# Run database migrations
python label_studio/manage.py migrate
python label_studio/manage.py collectstatic
# Start the server in development mode at http://localhost:8080
python label_studio/manage.py runserver 8673 
#                                       port

```

## Installation

1. **Install requirements pip**:

   ```bash
   pip install -r reqs.txt
2. **Config autolabeling/.env file**:
3. **Run**:
    ```bash
    cd autolabeling
    uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4 --reload
