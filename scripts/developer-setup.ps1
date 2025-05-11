# This script sets up the development environment for the project on Windows.
# It installs necessary dependencies, initializes submodules, migrates the database, and starts the application.
# Required tools: docker, docker compose, nodejs, npm

# 1. Check out wiki submodule
Set-Location -Path ./docs
git submodule update --init --recursive
git checkout master
Set-Location -Path ..

# 2. Install all node modules
Set-Location -Path ./backend
npm install
Set-Location -Path ../frontend
npm install
Set-Location -Path ../cdk
npm install
Set-Location -Path ..

# 3. Start the containers
docker-compose up -d --build

# 4. Migrate the database
Set-Location -Path ./backend
npm run prisma:migrate
Set-Location -Path ..

# 5. Compile the frontend
Set-Location -Path ./frontend
npm run build
Set-Location -Path ..

# 6. Open localhost:80 in the browser
if (Get-Command "start" -ErrorAction SilentlyContinue) {
    start http://localhost:80
} else {
    Write-Host "Please open http://localhost:80 in your browser."
}
