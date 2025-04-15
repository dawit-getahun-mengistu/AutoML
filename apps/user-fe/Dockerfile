# Base image
FROM node:22

# Set working directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY user-fe/package*.json ./
RUN npm install

# Copy the rest of the source code
COPY user-fe ./

# Expose the Next.js port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]