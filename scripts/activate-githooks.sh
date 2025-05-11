#!/bin/bash
# This script activates Git hooks by copying them from the .githooks directory to the .git/hooks directory.
# Currently includes: prepare-commit-msg to adjust commit messages to the branch name and related conventions.

# echo "Activating Git hooks..."
echo "This script will use the branch name to adjust the commit messages."
echo "Please ensure you follow this branch naming convention: <type>/<issue-nr>-<name>."
echo "For example: feature/1234-implement-feature, bugfix/5678-small-bug-fix or chore/91011-some-chore-update."
echo "If you don't want to follow this branch naming convention, please run the deactivate-githooks.sh script to remove the hooks again (or use the Makefile)."

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
