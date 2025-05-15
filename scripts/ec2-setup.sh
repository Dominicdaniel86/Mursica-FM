#!/bin/bash
# This script sets up the development environment for the project on an EC2 instance.
# It installs necessary dependencies, initializes submodules, and starts the application.

PROJECT_NAME="$1"
echo "First argument: $PROJECT_NAME"

cd /home/ec2-user
# Install necessary packages and tools
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Ensure nvm is loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # Load nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # Load nvm bash_completion

nvm install v20
nvm use v20
dnf install docker -y
systemctl start docker
systemctl enable docker

mkdir -p ~/.docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
    -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

POSTGRES_USER=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_USER" --with-decryption --query "Parameter.Value" --output text) \
    && echo "POSTGRES_USER=$POSTGRES_USER" >> /home/ec2-user/${PROJECT_NAME}/database/.env
POSTGRES_PASSWORD=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_PASSWORD" --with-decryption --query "Parameter.Value" --output text) \
    && echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> /home/ec2-user/${PROJECT_NAME}/database/.env
POSTGRES_DB=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_DB" --with-decryption --query "Parameter.Value" --output text) \
    && echo "POSTGRES_DB=$POSTGRES_DB" >> /home/ec2-user/${PROJECT_NAME}/database/.env

ENVIRONMENT=$(aws ssm get-parameter --name "/mursica/backend/ENVIRONMENT" --query "Parameter.Value" --output text) \
    && echo "ENVIRONMENT=$ENVIRONMENT" >> /home/ec2-user/${PROJECT_NAME}/backend/.en
PORT=$(aws ssm get-parameter --name "/mursica/backend/PORT" --query "Parameter.Value" --output text) \
    && echo "PORT=$PORT" >> /home/ec2-user/${PROJECT_NAME}/backend/.env
CLIENT_ID=$(aws ssm get-parameter --name "/mursica/backend/CLIENT_ID" --query "Parameter.Value" --output text) \
    && echo "CLIENT_ID=$CLIENT_ID" >> /home/ec2-user/${PROJECT_NAME}/backend/.env
CLIENT_SECRET=$(aws ssm get-parameter --name "/mursica/backend/CLIENT_SECRET" --with-decryption --query "Parameter.Value" --output text) \
    && echo "CLIENT_SECRET=$CLIENT_SECRET" >> /home/ec2-user/${PROJECT_NAME}/backend/.env
DATABASE_URL=$(aws ssm get-parameter --name "/mursica/backend/DATABASE_URL" --query "Parameter.Value" --output text) \
    && echo "DATABASE_URL=$DATABASE_URL" >> /home/ec2-user/${PROJECT_NAME}/backend/.env

cd /home/ec2-user/${PROJECT_NAME}
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout /home/ec2-user/Mursica-FM/ssl/server.key -out /home/ec2-user/Mursica-FM/ssl/server.crt

cd /home/ec2-user/${PROJECT_NAME}/backend && npm install
cd /home/ec2-user/${PROJECT_NAME}/frontend && npm install

cd /home/ec2-user/${PROJECT_NAME} && docker compose up -d --build

cd /home/ec2-user/${PROJECT_NAME}/backend && npm run prisma:migrate
cd /home/ec2-user/${PROJECT_NAME}/frontend && npm run build

cd /home/ec2-user/${PROJECT_NAME} && docker compose up -d --build
