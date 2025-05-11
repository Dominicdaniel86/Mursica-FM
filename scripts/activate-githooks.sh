#!/bin/bash

# Call the deactivate-githook.sh script if it exists
DEACTIVATE_SCRIPT="./scripts/deactivate-githooks.sh"

if [ -f "$DEACTIVATE_SCRIPT" ]; then
    echo "Running deactivate-githooks.sh..."
    bash "$DEACTIVATE_SCRIPT"
else
    echo "No deactivate-githooks.sh script found. Skipping."
fi

# Define the source and destination directories
GITHOOKS_DIR=".githooks"
GIT_HOOKS_DEST=".git/hooks"

# Check if the .githooks directory exists
if [ ! -d "$GITHOOKS_DIR" ]; then
    echo "Error: $GITHOOKS_DIR directory does not exist."
    exit 1
fi

# Check if the .git/hooks directory exists
if [ ! -d "$GIT_HOOKS_DEST" ]; then
    echo "Error: $GIT_HOOKS_DEST directory does not exist. Are you sure this is a Git repository?"
    exit 1
fi

# Copy all files from .githooks to .git/hooks
cp -a "$GITHOOKS_DIR/." "$GIT_HOOKS_DEST/"

# Rename all hook files to remove the .sh extension
for hook in "$GIT_HOOKS_DEST/"*.sh; do
    mv "$hook" "${hook%.sh}"
done

# Make sure all hook scripts are executable
chmod +x "$GIT_HOOKS_DEST/"*

echo "Git hooks have been successfully activated."
