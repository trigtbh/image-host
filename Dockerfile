# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Define the command to run your app
CMD ["node", "server.js"]
