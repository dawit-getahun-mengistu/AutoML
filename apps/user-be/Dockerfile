# Base image
FROM node:22


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . ./




# Expose the port on which the app will run
EXPOSE 3001

# Start the server using the production build
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]

