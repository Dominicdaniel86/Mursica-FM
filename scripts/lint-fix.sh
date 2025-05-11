#!/bin/bash
# This script runs Linter checks on both the backend and frontend directories and fixes issues if necessary.

echo "Running Linter checks with --fix flag..."

cd backend && npm run lint:fix
cd ../frontend && npm run lint:fix
