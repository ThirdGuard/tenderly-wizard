#!/bin/bash

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
    echo "Error: NPM_TOKEN environment variable is not set"
    echo "Please set NPM_TOKEN first using: source set-npm-token.sh <your_token>"
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

# Set npm auth token
echo "Configuring npm authentication..."
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}"> ~/.npmrc

# Get the name of the newly created .tgz file
PACKAGE_FILE=$(ls tenderly-wizard-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    echo "Error: No .tgz file found after npm pack"
    exit 1
fi

# Uninstall existing global package
echo "Uninstalling existing global package..."
npm uninstall -g tenderly-wizard


# Install globally
echo "Installing package globally..."
npm i -g "./$PACKAGE_FILE"

echo "Build and installation completed successfully!" 