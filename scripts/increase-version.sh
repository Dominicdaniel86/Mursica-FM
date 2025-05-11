#!/bin/bash

# Print the version passed as an argument
if [ -z "$1" ]; then
    echo "No version provided."
    exit 1
fi

# Read the first argument
version_type=$1

DOCKER_COMPOSE_FILE="docker-compose.yaml"
CURRENT_PROJECT_VERSION=$(grep -E "image:.*mursica-fm-backend:" "$DOCKER_COMPOSE_FILE" | sed -E 's/.*mursica-fm-backend:([^ ]*).*/\1/')

echo "Current project version: $CURRENT_PROJECT_VERSION"

MAJOR_VERSION=$(echo "$CURRENT_PROJECT_VERSION" | cut -d. -f1)
MINOR_VERSION=$(echo "$CURRENT_PROJECT_VERSION" | cut -d. -f2)
PATCH_VERSION=$(echo "$CURRENT_PROJECT_VERSION" | cut -d. -f3 | cut -d- -f1)
FULL_PRERELEASE=$(echo "$CURRENT_PROJECT_VERSION" | grep -Eo "(alpha|beta)\.[0-9]+$")
PRERELEASE_VERSION=$(echo "$FULL_PRERELEASE" | grep -Eo "[0-9]+$")
PRERELEASE_TYPE=$(echo "$FULL_PRERELEASE" | grep -Eo "(alpha|beta)")

# Check if any version component is missing
if [ -z "$MAJOR_VERSION" ]; then
    echo "Error: MAJOR_VERSION is missing. Expected a valid major version."
    exit 1
fi
if [ -z "$MINOR_VERSION" ]; then
    echo "Error: MINOR_VERSION is missing. Expected a valid minor version."
    exit 1
fi
if [ -z "$PATCH_VERSION" ]; then
    echo "Error: PATCH_VERSION is missing. Expected a valid patch version."
    exit 1
fi

# Check if the argument matches "major", "minor", or "patch"
if [[ "$version_type" == "major" ]]; then
    NEW_MAJOR_VERSION=$((MAJOR_VERSION + 1))

    if [[ -n "$PRERELEASE_VERSION" ]]; then # Check if a pre-release version exists
        NEW_VERSION="${NEW_MAJOR_VERSION}.0.0-${PRERELEASE_TYPE}.1"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    else
        NEW_VERSION="${NEW_MAJOR_VERSION}.0.0"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    fi
elif [[ "$version_type" == "minor" ]]; then
    NEW_MINOR_VERSION=$((MINOR_VERSION + 1))

    if [[ -n "$PRERELEASE_VERSION" ]]; then # Check if a pre-release version exists
        NEW_VERSION="${MAJOR_VERSION}.${NEW_MINOR_VERSION}.0-${PRERELEASE_TYPE}.1"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    else
        NEW_VERSION="${MAJOR_VERSION}.${NEW_MINOR_VERSION}.0"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    fi
elif [[ "$version_type" == "patch" ]]; then
    NEW_PATCH_VERSION=$((PATCH_VERSION + 1))

    if [[ -n "$PRERELEASE_VERSION" ]]; then # Check if a pre-release version exists
        NEW_VERSION="${MAJOR_VERSION}.${MINOR_VERSION}.${NEW_PATCH_VERSION}-${PRERELEASE_TYPE}.1"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    else
        NEW_VERSION="${MAJOR_VERSION}.${MINOR_VERSION}.${NEW_PATCH_VERSION}"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    fi
elif [[ "$version_type" == "prerelease" ]]; then
    NEW_PRERELEASE_VERSION=$((PRERELEASE_VERSION + 1))

    if [[ -n "$PRERELEASE_VERSION" ]]; then # Check if a pre-release version exists
        NEW_VERSION="${MAJOR_VERSION}.${MINOR_VERSION}.${PATCH_VERSION}-${PRERELEASE_TYPE}.${NEW_PRERELEASE_VERSION}"
        echo "Updated version:         $NEW_VERSION"
        scripts/set-version.sh "$NEW_VERSION"
    else
        echo "Error: Expected a valid pre-release version. Please provide a valid pre-release version."
    fi
else
    echo "Error: Invalid version type. Expected 'major', 'minor', 'patch', or 'prerelease'."
    exit 1
fi

