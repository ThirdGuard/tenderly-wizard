import fs from 'fs';
import path from "path";
import { execSync } from "child_process";


/**
 * Updates package.json with new scripts
 * @returns {void}
 */

// "save:vnet-snapshot": "hardhat run /Users/michaellungu/.nvm/versions/node/v20.13.0/bin/dist/scripts/save-vnet-snapshot.js --network virtual_mainnet"
export function updatePackageJson() {
    const tenderlyWizardPath = execSync('which tenderly-wizard').toString().trim();
    console.log("tenderlyWizardPath: ", tenderlyWizardPath);

    // Use fs.realpathSync instead of readlink -f for cross-platform compatibility
    const appPath = fs.realpathSync(tenderlyWizardPath).replace(/(.*tenderly-wizard).*/, '$1');
    console.log("appPath: ", appPath);

    const scriptsToAdd = {
        "deploy:safes": `hardhat run ${appPath}/dist/scripts/deploy-vnet-safes.js --network virtual_mainnet`,
        "deploy:whitelist": `hardhat run ${appPath}/dist/scripts/whitelist-vnet-safes.js --network virtual_mainnet`,
        "save:vnet-snapshot": `hardhat run ${appPath}/dist/scripts/save-vnet-snapshot.js --network virtual_mainnet`
    };

    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        Object.assign(packageJson.scripts, scriptsToAdd);

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Scripts added to package.json successfully.');

        return scriptsToAdd
    } else {
        console.error('package.json not found in the current working directory.');
    }
}

/**
 * Removes ANSI escape codes from a string
 * @param {string} str - The input string containing ANSI escape codes
 * @returns {string} The cleaned string with all ANSI escape codes removed
 * @description This function removes all ANSI escape sequences (color codes, cursor movements, etc.) 
 * from a string, making it suitable for logging or processing without formatting characters.
 * Useful when working with terminal output that needs to be cleaned of formatting.
 */

export function stripAnsi(str: string): string {
    // Pattern to match all ANSI escape codes
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
    ].join('|');

    return str.replace(new RegExp(pattern, 'g'), '');
}