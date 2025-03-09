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

# Expose port
EXPOSE 3000

# Start the frontend
CMD ["yarn", "start", "--host", "0.0.0.0"]
