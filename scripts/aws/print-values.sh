echo "========================="

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

if [[ -z "$DOMAIN_NAME" || "$DOMAIN_NAME" == "null" ]]; then
    echo "Domain name: not set"
else
    echo "Domain Name: $DOMAIN_NAME"
fi

if [[ -z "$GIT_BRANCH" || "$GIT_BRANCH" == "null" ]]; then
    echo "Git branch: not set"
else
    echo "Git Branch: $GIT_BRANCH"
fi

if [[ -z "$REPOSITORY_NAME" || "$REPOSITORY_NAME" == "null" ]]; then
    echo "Repository name: not set"
else
    echo "Repository Name: $REPOSITORY_NAME"
fi

if [[ -z "$REPOSITORY_URL" || "$REPOSITORY_URL" == "null" ]]; then
    echo "Repository URL: not set"
else
    echo "Repository URL: $REPOSITORY_URL"
fi

echo "========================="
