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
    DOMAIN_NAME=''
fi

if [[ -z "$GIT_BRANCH" || "$GIT_BRANCH" == "null" ]]; then
    GIT_BRANCH=''
fi

if [[ -z "$REPOSITORY_NAME" || "$REPOSITORY_NAME" == "null" ]]; then
    REPOSITORY_NAME=''
fi

if [[ -z "$REPOSITORY_URL" || "$REPOSITORY_URL" == "null" ]]; then
    REPOSITORY_URL=''
fi

echo "========================="

echo "Enter the domain name {current value: $DOMAIN_NAME}:"
read new_domain_name
if [[ -n "$new_domain_name" ]]; then
    DOMAIN_NAME=$new_domain_name
fi

echo "Enter the git branch {current value: $GIT_BRANCH}:"
read new_git_branch
if [[ -n "$new_git_branch" ]]; then
    GIT_BRANCH=$new_git_branch
fi

echo "Enter the repository name {current value: $REPOSITORY_NAME}:"
read new_repository_name
if [[ -n "$new_repository_name" ]]; then
    REPOSITORY_NAME=$new_repository_name
fi

echo "Enter the repository URL {current value: $REPOSITORY_URL}:"
read new_repository_url
if [[ -n "$new_repository_url" ]]; then
    REPOSITORY_URL=$new_repository_url
fi

# Create or update config.json
cat > "$CONFIG_FILE" <<EOF
{
  "domain_name": "$DOMAIN_NAME",
  "git_branch": "$GIT_BRANCH",
  "repository_name": "$REPOSITORY_NAME",
  "repository_url": "$REPOSITORY_URL"
}
EOF

echo "config.json has been updated at $CONFIG_FILE"

echo "========================="
