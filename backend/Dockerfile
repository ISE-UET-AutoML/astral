FROM node:16-alpine as builder


RUN mkdir /app
COPY ./package.json /app
COPY ./yarn.lock /app
WORKDIR /app
RUN yarn global add pm2
RUN yarn install

COPY . .
CMD ["yarn", "dev"]
EXPOSE 8685
