#!/bin/bash

# Verify npm authentication is configured (via .npmrc or NPM_TOKEN env var)
if [ -z "$NPM_TOKEN" ] && ! npm whoami &>/dev/null; then
    echo "Error: No npm authentication found."
    echo "Either set the NPM_TOKEN environment variable or configure auth in ~/.npmrc"
    exit 1
fi

# Clean dist folder
echo "Cleaning dist folder..."
rm -rf dist/

# Run yarn build
echo "Building project..."
yarn build

# Delete old .tgz files
echo "Removing old .tgz files..."
rm -f tenderly-wizard-*.tgz

# Create new package
echo "Creating new package..."
npm pack

# Get the name of the newly created .tgz file
PACKAGE_FILE=$(ls tenderly-wizard-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    echo "Error: No .tgz file found after npm pack"
    exit 1
fi

# Uninstall existing global package
echo "Uninstalling existing global package..."
# Try to remove the module directory first if it exists
rm -rf "$HOME/.nvm/versions/node/$(node -v)/lib/node_modules/tenderly-wizard" 2>/dev/null || true
npm uninstall -g tenderly-wizard --force


# Install globally
echo "Installing package globally..."
npm i -g "./$PACKAGE_FILE"

echo "Build and installation completed successfully!" 