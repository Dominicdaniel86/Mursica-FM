FROM node:24.0.1-bullseye
RUN apt-get update
RUN apt-get install -y dos2unix \
    && apt-get install -y netcat-openbsd

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma prisma
RUN npm install

COPY scripts/wait-for-it.sh /usr/src/app/wait-for-it.sh
RUN dos2unix /usr/src/app/wait-for-it.sh
RUN chmod +x /usr/src/app/wait-for-it.sh

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["./wait-for-it.sh", "postgresql-container", "5432", "npm", "run", "dev"]
