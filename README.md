# tenderly-wizard: Local Development and Testing

This guide covers how to develop, pack, and test the tenderly-wizard package locally.

## Prerequisites

- Node.js (version 14 or later)
- npm (usually comes with Node.js)

## Development

1. Clone the repository:
   ```
   git clone https://github.com/thirdguard/tenderly-wizard.git
   cd tenderly-wizard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make your changes to the source code in the `src` directory.

## Creating a Local Package

1. Update the version in `package.json` if necessary.

2. Pack the package:
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