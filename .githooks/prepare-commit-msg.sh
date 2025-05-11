#!/bin/bash

COMMIT_MSG_FILE=$1 # The file that contains the commit message
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE") # Read the commit message
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) # Get the current branch name

CORE_COMMIT_MSG="..." # Placeholder for core commit message /following feature/ or chore/ etc.
FINAL_COMMIT_MSG="..." # Placeholder for final commit message

if [[ "$BRANCH_NAME" == "main" || "$BRANCH_NAME" == "develop" ]]; then
  echo "❌ Commit messages are not allowed on the main or develop branches."
  exit 1
elif [[ "$BRANCH_NAME" == feature/* ]]; then
  CORE_COMMIT_MSG=${BRANCH_NAME#feature/}
  FINAL_COMMIT_MSG=" feat "
elif [[ "$BRANCH_NAME" == chore/* ]]; then
  CORE_COMMIT_MSG=${BRANCH_NAME#chore/}
  FINAL_COMMIT_MSG=" chore "
elif [[ "$BRANCH_NAME" == bugfix/* ]]; then
  CORE_COMMIT_MSG=${BRANCH_NAME#bugfix/}
  FINAL_COMMIT_MSG=" fix "
elif [[ "$BRANCH_NAME" == hotfix/* ]]; then
  CORE_COMMIT_MSG=${BRANCH_NAME#hotfix/}
  FINAL_COMMIT_MSG=" hotfix "
else
  echo "❌ Invalid branch name format. Expected format: feature/*, chore/* bugfix/*, or hotfix/*."
  exit 1
fi

# Break down the branch name into parts
MILESTONE_ABBR=$(echo "$CORE_COMMIT_MSG" | cut -d'-' -f1)
ISSUE_NR=$(echo "$CORE_COMMIT_MSG" | cut -d'-' -f2)
ISSUE_NAME=$(echo "$CORE_COMMIT_MSG" | cut -d'-' -f3-)

# Validate the format of the branch name
if [[ -z "$MILESTONE_ABBR" || -z "$ISSUE_NR" || -z "$ISSUE_NAME" ]]; then
  echo "❌ Invalid branch name format. Expected format: <MILESTONE_ABBR>-<ISSUE_NR>-<ISSUE_NAME> (e.g., abc-123-description)."
  exit 1
fi

MILESTONE_ABBR=$(echo "$MILESTONE_ABBR" | tr '[:lower:]' '[:upper:]')
COMMIT_MSG=$(echo "$COMMIT_MSG" | sed -E 's/^(.)/\U\1/')

FINAL_COMMIT_MSG="${MILESTONE_ABBR}-${ISSUE_NR}${FINAL_COMMIT_MSG}${COMMIT_MSG}"

echo "Final commit message: $FINAL_COMMIT_MSG"
echo "$FINAL_COMMIT_MSG" > "$COMMIT_MSG_FILE" # Write the final commit message to the file


