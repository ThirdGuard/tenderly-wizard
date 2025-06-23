import { ChainId } from "zodiac-roles-sdk";
import { RolesVersion } from "../utils/types";
import { executeWhitelistV2 } from "../whitelist/whitelist-class";
import { setGas } from "../utils/util";
import config from "../env-config";
import path from "path";

async function main() {
    if (!process.env.SELECTED_PERMISSIONS_FILE_V2) {
        console.error("No permissions file selected");
        process.exit(1);
    }

    const permissionsFile = process.env.SELECTED_PERMISSIONS_FILE_V2;

    // set gas for all accounts
    await setGas();

    // get roles version from .env
    const rolesVersion = config.ROLES_VERSION as RolesVersion;

    // get chain
    const chainId = config.TENDERLY_FORK_ID as ChainId;

    const absolutePath = path.resolve(permissionsFile);
    const { default: permissions, chainId: permissionsChainId } =
        require(absolutePath);

    console.log("permissions: ", permissions);
    console.log("permissionsChainId: ", permissionsChainId);

    try {
        // check if the current permission chainId matches the chainId in .env
        if (permissionsChainId === chainId) {
            await executeWhitelistV2(permissions, chainId, rolesVersion);
            console.log(`Whitelist executed successfully for ${permissionsFile}`);
        } else {
            console.log(
                `Skipping whitelist for ${permissionsFile} because of chainId mismatch (expected ${chainId}, got ${permissionsChainId})`
            );
        }
    } catch (error) {
        console.error(`Error executing whitelist for ${permissionsFile}:`, error);
    }
}

main(); 