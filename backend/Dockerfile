# Use Node.js base image
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files before installing dependencies (better caching)
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend server
CMD ["yarn", "dev"]
