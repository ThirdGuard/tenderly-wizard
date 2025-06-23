# tenderly-wizard (Roles v1 / Ethers v5)

## Overview

The tenderly-wizard is a CLI tool that streamlines the management of Tenderly virtual testnets. Key features include:

• Deploy Safe addresses that remain consistent across chains
• Deploy and configure role management contracts
• Execute whitelisting
• Create, fork, manage and preserve virtual testnet states through snapshots

# tenderly-wizard: Local Development and Testing

This guide covers how to develop, pack, and test the tenderly-wizard package locally.

## Prerequisites

- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- NPM_TOKEN with read access to the `@thirdguard` npm organization
- .env file in the root of the project by using the `@thirdguard/config` package.

## Local Installation and Testing

1. Add the NPM_TOKEN to your shell environment variables by running:

   ```
   export NPM_TOKEN=<your-npm-token>
   ```

   or

   ```
   # using NPM_TOKEN as an input argument
   source ./set-npm-token.sh <your-npm-token>
   ```

2. Install the package globally:

   ```
   ./build-and-install.sh
   ```

3. Run the CLI:

   ```
   tenderly-wizard
   ```

4. To uninstall:
   ```
   npm uninstall -g tenderly-wizard
   ```

## Basic Usage

- Once The Tenderly Wizard is installed globally, in terminal navigate to directory of the repo you would like to use for testing.

- ##### NOTE FOR WHITELISTING:
  - The access-control-safes folder needs to be in the same folder structure as the directory you would like to use this in:
  ```
  - folder
  --- access-control-safes
  --- repo-you-want-to-run-this-wizard-in
  ```
  - The reason for this is that the tenderly-wizard will use that repo to access the whitelisting scripts

1. To start the tenderly wizard run:

```
tenderly-wizard
```

2. The wizard will display a list of options, to get started select any of the 2 options:

   - `+CREATE TESTNET & SETUP+` - Creates a new testnet, sets up Safes and Roles contracts and executes whitelisting
   - `+CREATE TESTNET+` - Creates a new testnet

3. Select an existing testnet to manage or activate it. Activating a testnet will update the .env file with the testnet's RPC URL, chain ID, Testnet UUID and current snapshot ID.

## Development

1. Follow the steps in the [Local Installation and Testing](#local-installation-and-testing) section to set up the environment.

2. Ensure you have the `IS_DEV` environment variable set to `true` in the .env file.

3. Make your changes to the source code in the `src` directory.

4. Run `yarn start` to start the wizard.

## Publishing to npm

To publish a new version of the package to npm:

1. Ensure your git working directory is clean (no uncommitted changes).

2. Make the publish script executable (first time only):

   ```
   chmod +x publish.sh
   ```

3. Run the publish script:

   ```
   ./publish.sh
   ```

4. The script will:

   - Verify your working directory is clean
   - Display current package version and ethers dependency version
   - Prompt you to select version bump type (patch or minor)
   - Build the project
   - Update the version in package.json
   - Create a git commit and tag
   - Publish to npm with the appropriate tag (v5-latest or v6-latest)

5. Important notes:
   - The script enforces version alignment with ethers.js:
     - For ethers v5.x.x, package version must start with "5."
     - For ethers v6.x.x, package version must start with "6."
   - The npm tag is automatically set based on the ethers version:
     - v5.x.x uses "v5-latest"
     - v6.x.x uses "v6-latest"
   - To install globally after publishing:
     - For Roles V1 (ethers v5): `npm i -g tenderly-wizard@v5-latest` or `npm i -g tenderly-wizard`
     - For Roles V2 (ethers v6): `npm i -g tenderly-wizard@v6-latest`

## Troubleshooting

- If you encounter issues, try clearing npm's cache:

  ```
  npm cache clean --force
  ```

- For verbose logging, run:
  ```
  NODE_DEBUG=module tenderly-wizard
  ```

## Gotchas

- Creating or Forking a new testnet will activate it by default.
- The `Apply Whitelist` option will only work if the Safe and Role contracts have been deployed and configured.

## Notes

- Always test thoroughly before publishing to npm.
- Remember to gitignore the `.tgz` files created by `npm pack`.
