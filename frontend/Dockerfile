FROM node:16-alpine as builder

ARG REACT_APP_API_URL
ARG REACT_APP_ML_SERVICE_ADDR

RUN mkdir /app

COPY ./package.json /app
COPY ./yarn.lock /app

WORKDIR /app

RUN yarn
COPY . .

CMD yarn start
EXPOSE 3000
