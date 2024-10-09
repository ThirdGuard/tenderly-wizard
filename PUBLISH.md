# tenderly-wizard: Publishing and Updating on npm

This guide covers how to publish and update the tenderly-wizard package on npm.

## Prerequisites

- Node.js (version 14 or later)
- npm account (create one at https://www.npmjs.com/signup)
- npm CLI logged in (`npm login`)

## Initial Publication

1. Ensure your `package.json` is up to date:
   - Correct version number
   - Appropriate description, keywords, author, license, etc.
   - Correct main file and bin entries

2. Prepare your package:
   ```
   npm install
   ```

3. Publish to npm:
   ```
   npm publish
   ```

## Updating the Package

1. Update your code as necessary.

2. Update the version in `package.json`:
   - For bug fixes: `npm version patch`
   - For new features (backwards-compatible): `npm version minor`
   - For breaking changes: `npm version major`

3. Commit your changes:
   ```
   git add .
   git commit -m "Description of changes"
   ```

4. Publish the new version:
   ```
   npm publish
   ```

## Best Practices

- Always test your package thoroughly before publishing.
- Use semantic versioning (semver) for version numbers.
- Include a CHANGELOG.md to document changes between versions.
- Tag your releases in git:
  ```
  git tag -a v1.0.1 -m "Version 1.0.1"
  git push origin v1.0.1
  ```

## Managing Releases

- To deprecate a version:
  ```
  npm deprecate tenderly-wizard@"< 1.0.4" "Critical bug fixed in 1.0.4"
  ```

- To unpublish a version (within 72 hours of publishing):
  ```
  npm unpublish tenderly-wizard@1.0.3
  ```

## Notes

- Once published, the package will be available at `https://www.npmjs.com/package/tenderly-wizard`
- Users can install it using `npm install -g tenderly-wizard`
- Remember to update any relevant documentation or README files with each release.