# tenderly-wizard: Local Development and Testing

This guide covers how to develop, pack, and test the tenderly-wizard package locally.

## Prerequisites

- Node.js (version 14 or later)
- npm (usually comes with Node.js)

## Usage

1. Ensure you have the .env file in the root of the project by using the `@thirdguard/config`` package.
2. Ensure you have the NPM_TOKEN environment variable set in the .env file.
3. run `yarn install` to install the dependencies.
4. run `yarn build` to build the project.
5. run `npm pack` to create the package.
6. run `npm install -g tenderly-wizard-x.x.x.tgz` to install the package globally.
7. run `tenderly-wizard` to start the wizard.

## Development

1. Ensure you have the .env file in the root of the project by using the `@thirdguard/config` package.

2. Ensure you have the NPM_TOKEN environment variable set in the .env file.

3. Ensure you have the `IS_DEV` environment variable set to `true` in the .env file.

4. run `yarn install` to install the dependencies.

5. Make your changes to the source code in the `src` directory.

## Creating a Local Package

1. Update the version in `package.json` if necessary.

2. Run `yarn build` to build the package.

3. Pack the package:
   ```
   npm pack
   ```
   This creates a file named `tenderly-wizard-x.x.x.tgz`.

## Local Installation and Testing

1. Install the package globally:

   ```
   npm install -g ./tenderly-wizard-x.x.x.tgz
   ```

2. Run the CLI:

   ```
   tenderly-wizard
   ```

3. To uninstall:
   ```
   npm uninstall -g tenderly-wizard
   ```

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
