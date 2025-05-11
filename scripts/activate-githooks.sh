#!/bin/bash

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

# Make sure all hook scripts are executable
chmod +x "$GIT_HOOKS_DEST/"*

echo "Git hooks have been successfully activated."
