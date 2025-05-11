#!/bin/bash
# This script deactivates all Git hooks by removing all files in the .git/hooks directory that do not have a .sample extension.

echo "Deactivating Git hooks..."

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