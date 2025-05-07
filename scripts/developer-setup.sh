# !/bin/bash
# This script sets up the development environment for the project.
# It installs necessary dependencies, initializes submodules, and starts the application.
# Required tools: docker, docker compose, nodejs, npm
# Optional tool: xdg-open (for opening the browser automatically)

# 1. Check out wiki submodule
cd /docs
git submodule update --init --recursive
git checkout master
cd ..

# 2. Install all node modules
cd /backend
npm install
cd ../frontend
npm install
cd ../cdk
npm install
cd ..

# 3. Start the containers
docker compose up -d --build

# 4. Migrate the database
cd ./backend
npm run prisma:migrate
cd ..

# 5. Compile the frontend
cd ./frontend
npm run build
cd ..

# 6. Open localhost:80 in the browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:80
elif command -v open > /dev/null; then
    open http://localhost:80
else
    echo "Please open http://localhost:80 in your browser."
fi
