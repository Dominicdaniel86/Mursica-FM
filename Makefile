# Makefile for Mursica-FM
# This Makefile allows you to call scripts from the folder by using "make <target>"
# This Makefile provides a set of commands to manage the Mursica-FM project.

# Default target when just typing 'make'
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Mursica-FM Makefile Help"
	@echo "========================="
	@echo "Available targets:"
	@echo "  dev-setup                                       - Setup the development environment"
	@echo "  dev-setup-windows                               - Setup the development environment for Windows"
	@echo "  update-deps                                     - Update npm dependencies"
	@echo "  test-tools                                      - Check which required dev tools are installed"
	@echo "  db-<command>	                                  - Run database commands (migrate, generate, push, reset)"
	@echo "  docker-<command>                                - Run Docker commands (up, build, down, logs, push)"
	@echo "  set-version VERSION=<version>                   - Set the project version and all references to it"
	@echo "  increase-version(-major/-minor/-prerelease)     - Increase project version (default: patch | major | minor | prerelease (alpha/ beta))"
	@echo "  lint(-fix)                                      - Run ESLint (and fix errors if specified)"
	@echo "  prettier(-fix)                                  - Run Prettier (and fix errors if specified)"
	@echo "  activate-githooks                               - Activate pre-defined git hooks"
	@echo "  deactivate-githooks                             - Deactivate all local git hooks"
	@echo "  aws-<command>(-verbose)                         - Run AWS CDK commands (login, bootstrap, synth, deploy, diff, destroy). Verbose can be enabled for synth, deploy, diff and destroy"
	@echo "  aws-config-print                                - Print current config for the AWS CDK deployment"
	@echo "  aws-config-edit                                 - Edit the current config for the AWS CDK deployment"
	@echo "  update-wiki                                     - Update the wiki submodule"
	@echo "     "  

# Setup the development environment
dev-setup:
	@echo "Setting up development environment..."
	bash ./scripts/developer-setup.sh
dev-setup-windows:
	@echo "Setting up development environment for Windows..."
	bash ./scripts/developer-setup.ps1

# Update dependencies
update-deps:
	@echo "Updating dependencies..."
	bash ./scripts/update-dependencies.sh

# Test installed tools
test-tools:
	@echo "Testing installed tools..."
	bash ./scripts/test-tools.sh

# Database commands
db-migrate:
	@echo "Running database migrations..."
	cd backend && npm run prisma:migrate
db-generate:
	@echo "Generating Prisma client..."
	cd backend && npm run prisma:generate
db-push:
	@echo "Pushing to the database..."
	@echo "Please make sure to run this command only if you are sure about the changes."
	cd backend && npm run prisma:push
db-reset:
	@echo "Resetting the database..."
	cd backend && npm run prisma:reset

# Docker commands
docker-up:
	@echo "Starting Docker containers..."
	docker compose up -d
docker-build:
	@echo "Building and starting Docker containers..."
	docker compose up -d --build
docker-down:
	@echo "Stopping Docker containers..."
	docker compose down
docker-logs:
	@echo "Viewing Docker logs..."
	docker compose logs -f
docker-push:
	@echo "Pushing Docker images..."
	bash ./scripts/push-images.sh

# Set project version
set-version:
	@if [ -z "$(VERSION)" ]; then \
	  echo "VERSION is not set. Usage: 'make set-version VERSION=<version>'"; \
	  exit 1; \
	fi
	@echo "Increasing version to $(VERSION)..."
	bash ./scripts/set-version.sh $(VERSION)

# Increase project version (patch)
increase-version:
	@echo "Increasing version to next patch version..."
	bash ./scripts/increase-version.sh patch

# Increase project version (major)
increase-version-major:
	@echo "Increasing version to next major version..."
	bash ./scripts/increase-version.sh major

# Increase project version (minor)
increase-version-minor:
	@echo "Increasing version to next minor version..."
	bash ./scripts/increase-version.sh minor

# Increase project version (prerelease)
increase-version-prerelease:
	@echo "Increasing version to next prerelease version..."
	bash ./scripts/increase-version.sh prerelease

# Eslint & Prettier commands
lint:
	@echo "Running ESLint..."
	bash ./scripts/lint.sh
prettier:
	@echo "Running Prettier..."
	bash ./scripts/prettier.sh
lint-fix:
	@echo "Running ESLint fix..."
	bash ./scripts/lint-fix.sh
prettier-fix:
	@echo "Running Prettier fix..."
	bash ./scripts/prettier-fix.sh

# Activate/ Deactivate git hooks
activate-githooks:
	@echo "Activating git hooks..."
	bash ./scripts/activate-githooks.sh
deactivate-githooks:
	@echo "Deactivating git hooks..."
	bash ./scripts/deactivate-githooks.sh

# Update wiki submodule
update-wiki:
	@echo "Updating wiki submodule..."
	cd docs && git submodule update --init --recursive
	cd docs && git checkout master
	cd docs && git pull

# AWS & CDK related commands
aws-login:
	@echo "Logging into AWS..."
	@echo "Please make sure to have AWS CLI installed and configured."
	aws configure
	@echo "AWS login complete."
aws-bootstrap:
	@echo "Bootstrapping AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	cdk bootstrap
	@echo "AWS CDK bootstrap complete."

aws-synth:
	@echo "Synthesizing AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh synth
aws-deploy:
	@echo "Deploying AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh deploy
aws-diff:
	@echo "Diffing AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh diff
aws-destroy:
	@echo "Destroying AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh destroy

aws-synth-verbose:
	@echo "Synthesizing AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh synth verbose
aws-deploy-verbose:
	@echo "Deploying AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh deploy verbose
aws-diff-verbose:
	@echo "Diffing AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh diff verbose
aws-destroy-verbose:
	@echo "Destroying AWS CDK..."
	@echo "Please make sure to have AWS CDK installed."
	bash ./scripts/aws/deploy.sh destroy verbose

aws-config-print:
	@echo "Printing AWS CDK config..."
	@echo "Please make sure to have AWS CDK installed, as well as the 'jq' tool."
	bash ./scripts/aws/print-values.sh

aws-config-edit:
	@echo "Editing AWS CDK config..."
	@echo "Please make sure to have AWS CDK installed, as well as the '' tool."
	bash ./scripts/aws/configure-values.sh

# TODO: Run tests
# Test backend, test frontend, test all

.PHONY: help dev-setup dev-setup-windows update-deps test-tools db-migrate db-reset db-push docker-up docker-build docker-down docker-logs set-version increase-version increase-version-major increase-version-minor lint prettier lint-fix prettier-fix activate-githooks deactivate-githook aws update-wiki aws-login aws-bootstrap aws-synth aws-deploy aws-diff aws-destroy aws-synth-verbose aws-deploy-verbose aws-diff-verbose aws-destroy-verbose aws-config-print aws-config-edit
