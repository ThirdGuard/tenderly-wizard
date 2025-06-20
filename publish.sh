#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Helper Functions ---
function get_package_json_value() {
  node -p "require('./package.json').$1"
}

# --- Pre-flight checks ---
if ! git diff-index --quiet HEAD --; then
    echo "Git working directory is not clean. Please commit or stash your changes."
    exit 1
fi

echo "Git working directory is clean."

# --- Version Analysis ---
ETHERS_VERSION=$(get_package_json_value 'dependencies.ethers')
PACKAGE_VERSION=$(get_package_json_value 'version')
PACKAGE_NAME=$(get_package_json_value 'name')
ETHERS_MAJOR_VERSION=$(echo "$ETHERS_VERSION" | grep -oE '^[^0-9]*[0-9]+' | grep -oE '[0-9]+')

echo "-------------------------------------"
echo "Package Name: $PACKAGE_NAME"
echo "Current Package Version: $PACKAGE_VERSION"
echo "Ethers Version Detected: $ETHERS_VERSION (Major: v$ETHERS_MAJOR_VERSION)"
echo "-------------------------------------"

# --- Determine NPM Tag and Validate Version ---
NPM_TAG=""
if [ "$ETHERS_MAJOR_VERSION" == "6" ]; then
    NPM_TAG="v6"
    if [[ ! "$PACKAGE_VERSION" =~ ^6\. ]]; then
        echo "Warning: Ethers version is v6, but package version does not start with '6.'."
        echo "It's recommended to align your package version. For example: 6.0.0"
        echo "You can update it in package.json and commit the change before running this script again."
        exit 1
    fi
elif [ "$ETHERS_MAJOR_VERSION" == "5" ]; then
    NPM_TAG="latest"
    if [[ ! "$PACKAGE_VERSION" =~ ^5\. ]]; then
        echo "Warning: Ethers version is v5, but package version does not start with '5.'."
        echo "It's recommended to align your package version. For example: 5.0.0"
        echo "You can update it in package.json and commit the change before running this script again."
        exit 1
    fi
else
    echo "Error: Could not determine ethers major version (expected 5 or 6)."
    exit 1
fi

echo "This version will be published with npm tag: '$NPM_TAG'"
if [ "$NPM_TAG" == "latest" ]; then
    echo "It will also be installable via 'npm i -g $PACKAGE_NAME'"
    echo "A 'v5' dist-tag will also be added."
fi

# --- Get New Version ---
echo
echo "Select the type of version bump to perform:"
PS3="Your choice: "
options=("patch" "minor" "cancel")
select opt in "${options[@]}"
do
    case $opt in
        "patch")
            NEW_VERSION="patch"
            break
            ;;
        "minor")
            NEW_VERSION="minor"
            break
            ;;
        "cancel")
            echo "Publishing cancelled."
            exit 1
            ;;
        *) echo "Invalid option $REPLY. Please enter 1, 2, or 3.";;
    esac
done

if [ -z "$NEW_VERSION" ]; then
    echo "No version bump type selected. Aborting."
    exit 1
fi

# --- Confirmation ---
echo
echo "Ready to publish:"
echo "  - Package:           $PACKAGE_NAME"
echo "  - Current Version:   $PACKAGE_VERSION"
echo "  - New Version Bump:  $NEW_VERSION"
echo "  - NPM Tag:             '$NPM_TAG'"
echo

read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Publishing cancelled."
    exit 1
fi

# --- Build and Publish ---
echo "Building project..."
yarn build

echo "Updating package version..."
# yarn version will create a git tag and a commit
yarn version "$NEW_VERSION"

# Fetch the new version from package.json
NEW_PACKAGE_VERSION=$(get_package_json_value 'version')

echo "Committing package.json changes..."
git add package.json
git commit -m "chore: bump version to $NEW_PACKAGE_VERSION"

echo "Publishing to npm with tag '$NPM_TAG'..."
npm publish --tag "$NPM_TAG"

if [ "$NPM_TAG" == "latest" ]; then
    echo "Adding 'v5' tag to version $NEW_PACKAGE_VERSION..."
    npm dist-tag add "$PACKAGE_NAME@$NEW_PACKAGE_VERSION" v5
fi

echo "-------------------------------------"
echo "✅ Successfully published $PACKAGE_NAME@$NEW_PACKAGE_VERSION"
echo
echo "Don't forget to push your changes and tags to git:"
echo "git push && git push --tags"
echo "-------------------------------------" 