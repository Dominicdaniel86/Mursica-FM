#!/bin/bash
# Description: This script checks if the required tools are installed on the system.

# Backend
cd backend

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "Dependencies found. Updating..."
        npm update
    else
        echo "Dependencies not found. Installing..."
        npm install
    fi
else
    echo "package.json not found. Cannot proceed."
    exit 1
fi

# Frontend
cd ../frontend

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "Dependencies found. Updating..."
        npm update
    else
        echo "Dependencies not found. Installing..."
        npm install
    fi
else
    echo "package.json not found. Cannot proceed."
    exit 1
fi
