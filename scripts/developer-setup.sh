#!/bin/bash
# This script sets up the development environment for the project.
# It installs necessary dependencies, initializes submodules, migrates the database, and starts the application.
# Required tools: docker, docker compose, nodejs, npm
# Optional tool: xdg-open (for opening the browser automatically)

SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")" # Full directory path
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")" # Directory of the script
ROOT_DIR="$(realpath "$SCRIPT_DIR/..")" # Parent directory of the script

DB_HOST="localhost"
DB_PORT="5432"
DB_CMD="your-command-here"

# 1. Check out wiki submodule
cd "$ROOT_DIR/docs"
git submodule update --init --recursive
git checkout master

# 2. Install all node modules
cd "$ROOT_DIR/backend"
npm install
cd "$ROOT_DIR/frontend"
npm install
cd "$ROOT_DIR/cdk"
npm install

# 3. Compile the frontend
cd "$ROOT_DIR/frontend"
npm run build

# 4. Start the containers
cd "$ROOT_DIR"
sudo docker compose up -d --build

# 5. Migrate the database

# Wait for the database to be ready
/home/dominic/programming-projects/Mursica-FM/backend/scripts/wait-for-it.sh "$DB_HOST" "$DB_PORT" -- echo "Database is ready!"

cd "$ROOT_DIR/backend"
npm run prisma:migrate

echo "Script completed. The application should be running on localhost:80."

# 6. Open localhost:80 in the browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:80
elif command -v open > /dev/null; then
    open http://localhost:80
else
    echo "Please open http://localhost:80 in your browser."
fi
