#!/bin/bash
# This script runs Prettier checks on both the backend and frontend directories.

echo "Running Prettier checks..."

cd backend && npm run format:check
cd ../frontend && npm run format:check
