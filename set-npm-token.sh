#!/bin/bash

# Check if token parameter is provided
if [ -z "$1" ]; then
    echo "Error: NPM token is required"
    echo "Usage: source ./set-npm-token.sh <npm_token>"
    return 1
fi

# Export NPM token to environment
export NPM_TOKEN="$1"

# Print confirmation message
echo "NPM_TOKEN has been set successfully"

# Verify the token is set
echo "Current NPM_TOKEN value: $NPM_TOKEN" 