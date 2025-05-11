#!/bin/bash
# This script runs Linter checks on both the backend and frontend directories.

echo "Running Linter checks..."

cd backend && npm run lint
cd ../frontend && npm run lint
