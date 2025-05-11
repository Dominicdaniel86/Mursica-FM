#!/bin/bash
# This script runs Prettier checks on both the backend and frontend directories and formats the code if necessary.

echo "Running Prettier checks with --write flag..."

cd backend && npm run format
cd ../frontend && npm run format
