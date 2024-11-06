# tenderly-wizard

## Overview

The tenderly-wizard is a CLI tool that streamlines the management of Tenderly virtual testnets. Key features include:

• Deploy Safe addresses that remain consistent across chains
• Deploy and configure role management contracts (V1 and V2)
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
   ./set-npm-token.sh <your-npm-token>
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

1. To start the tenderly wizard run:

```
tenderly-wizard
```

2. The wizard will display a list of options, to get started select any of the 2 options:

   - +CREATE TESTNET & SETUP+ - Creates a new testnet, sets up Safes and Roles contracts and executes whitelisting
   - +CREATE TESTNET+ - Creates a new testnet

3. Select an existing testnet to manage or activate it. Activating a testnet will update the .env file with the testnet's RPC URL, chain ID, Testnet UUID and current snapshot ID.

## Development

1. Follow the steps in the [Local Installation and Testing](#local-installation-and-testing) section to set up the environment.

2. Ensure you have the `IS_DEV` environment variable set to `true` in the .env file.

3. Make your changes to the source code in the `src` directory.

4. Run `yarn start` to start the wizard.

## Troubleshooting

- If you encounter issues, try clearing npm's cache:

  ```
  npm cache clean --force
  ```

- For verbose logging, run:
  ```
  NODE_DEBUG=module tenderly-wizard
  ```

## Notes

- Always test thoroughly before publishing to npm.
- Remember to gitignore the `.tgz` files created by `npm pack`.
