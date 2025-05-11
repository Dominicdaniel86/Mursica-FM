#!/bin/bash

# Navigate to the .git/hooks directory
HOOKS_DIR=".git/hooks"

# Check if the directory exists
if [ -d "$HOOKS_DIR" ]; then
    # Remove all files that do not contain '.sample' in their name
    find "$HOOKS_DIR" -type f ! -name "*.sample" -exec rm -f {} \;
    echo "Non-sample hooks removed successfully."
else
    echo "Error: .git/hooks directory does not exist."
fi