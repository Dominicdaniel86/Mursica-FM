#!/bin/bash

ARG1=$1
ARG2=$2

# Check if the first argument is provided
if [ -z "$ARG1" ]; then
    echo "Usage: $0 <command> (verbose)"
    exit 1
fi

if [ "$ARG1" != "synth" ] && [ "$ARG1" != "deploy" ] && [ "$ARG1" != "destroy" ] && [ "$ARG1" != "diff"]; then
    echo "Invalid command. Use 'synth', 'deploy', 'destroy', or 'diff'."
    exit 1
fi

VERBOSE=FALSE

if [ "$ARG2" == "verbose" ]; then
    VERBOSE=TRUE
fi

# Enable/ Disable using verbose output
# Also use this script for also synth, delete and diff

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Path to the config.json file
CONFIG_FILE="${SCRIPT_DIR}/config.json"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "config.json not found in $SCRIPT_DIR"
    exit 1
fi

DOMAIN_NAME=$( jq -r '.domain_name' "$CONFIG_FILE" )
GIT_BRANCH=$( jq -r '.git_branch' "$CONFIG_FILE" )
REPOSITORY_NAME=$( jq -r '.repository_name' "$CONFIG_FILE" )
REPOSITORY_URL=$( jq -r '.repository_url' "$CONFIG_FILE" )

if [[ -z "$DOMAIN_NAME" || "$DOMAIN_NAME" == "null" || \
      -z "$GIT_BRANCH" || "$GIT_BRANCH" == "null" || \
      -z "$REPOSITORY_NAME" || "$REPOSITORY_NAME" == "null" || \
      -z "$REPOSITORY_URL" || "$REPOSITORY_URL" == "null" ]]; then
    echo "One or more required fields are missing in config.json (domain_name, git_branch, repository_name, repository_url)"
    exit 1
fi

echo "Domain Name: $DOMAIN_NAME"
echo "Git Branch: $GIT_BRANCH"
echo "Repository Name: $REPOSITORY_NAME"
echo "Repository URL: $REPOSITORY_URL"

AWS_DIR="${SCRIPT_DIR}/../../aws/"

cd "$AWS_DIR" || { echo "Failed to change directory to $AWS_DIR"; exit 1; }

if [[ "$VERBOSE" == "TRUE" ]]; then
    cdk "$ARG1" --require-approval any-change -c domainName="$DOMAIN_NAME" -c gitBranch="$GIT_BRANCH" -c repositoryName="$REPOSITORY_NAME" -c repositoryURL="$REPOSITORY_URL" --verbose
else
    cdk "$ARG1" --require-approval any-change -c domainName="$DOMAIN_NAME" -c gitBranch="$GIT_BRANCH" -c repositoryName="$REPOSITORY_NAME" -c repositoryURL="$REPOSITORY_URL"
fi
