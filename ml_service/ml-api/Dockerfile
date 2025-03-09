#===============================================
#======  Using Python 3.10 build Imange ========
#===============================================

# pull official base image
FROM python:3.10.14


# set work directory
WORKDIR /

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN pip install --upgrade pip

RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6  -y

COPY ./requirements.txt ./requirements.txt 
RUN pip install -r requirements.txt

# copy project
COPY ./ml-api/app/ /app/

EXPOSE 9090