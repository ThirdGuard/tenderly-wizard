
import { network } from "hardhat";
import { ChainId } from "zodiac-roles-sdk/.";
import { RolesVersion } from "../utils/types";
import { executeWhitelistV2 } from "../whitelist/whitelist-class";
import { findPermissionsFiles, setGas } from '../utils/util';
import path from "path";

export async function whitelistSafesV2(rolesDirectory: string = path.join(__dirname, 'src', 'roles')) {
    // find all files named permissions.ts in the src/roles directory
    let permissionsFiles: string[] = [];
    try {
        permissionsFiles = findPermissionsFiles(rolesDirectory);
    } catch (error) {
        console.error('Error finding permissions files:', error);
        process.exit(1);
    }

    // if no permissions files are found, throw an error
    if (permissionsFiles.length === 0) {
        throw new Error(`No permissions.ts files found in the ${rolesDirectory} directory or its subdirectories.`);
    }

    // set gas for all accounts
    await setGas();

    // get roles version from .env
    const rolesVersion = process.env.ROLES_VERSION as RolesVersion;

    // get chain
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || '1', 10) as ChainId

    // iterate all permissions files
    for (const file of permissionsFiles) {
        const { default: permissions, chainId: permissionsChainId } = require(file);

        console.log("permissions: ", permissions)
        console.log("permissionsChainId: ", permissionsChainId)

        try {
            // check if the current permission chainId matches the chainId in .env
            if (permissionsChainId === chainId) {
                await executeWhitelistV2(permissions, chainId, rolesVersion);
                console.log(`Whitelist executed successfully for ${file}`);
            }
        } catch (error) {
            console.error(`Error executing whitelist for ${file}:`, error);
        }
    }

    // save snapshot to .env
    const postWhitelistSnapshot = await network.provider.send("evm_snapshot", []);
    console.log("postWhitelistSnapshot: ", postWhitelistSnapshot);
    VirtualTestNet.addToEnvFile("TENDERLY_SNAPSHOT", postWhitelistSnapshot)
    // return base;
}
