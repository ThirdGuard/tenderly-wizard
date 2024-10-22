import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// @ts-ignore
import { ethers, network } from "hardhat";
import VirtualTestNet from "./create-vnet";
import { ChainId } from "zodiac-roles-sdk";
import { executeWhitelistV2 } from "../whitelist/whitelist-class";
import path from "path";
import fs from 'fs';
import { RolesVersion } from "../utils/types";

const { VIRTUAL_MAINNET_RPC } = process.env;

export async function whitelistSafes(rolesDirectory: string) {
    // find all files named permissions.ts in the src/roles directory
    let permissionsFiles: string[];
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

    /* @note add all whilist execution code here */
    /*********************************************/
    // iterate all permissions files
    for (const file of permissionsFiles) {
        const permissions = require(file).default;

        try {

            // switch (chainId) {
            //     case 1:
            //         // eth whitelists
            //         break;
            //     case 8453:
            //         // base whitelists
            //         // aerodrome 
            //         // await executeWhitelistV2(aerodromePermissions, chainId)
            //         break;
            //     case 137:
            //         // polygon whitelists
            //         break;
            //     default:
            //         break;
            // }

            // @audit need to find a way to detect the chain that the permissions file is for
            await executeWhitelistV2(permissions, chainId, rolesVersion);
            console.log(`Whitelist executed successfully for ${file}`);
        } catch (error) {
            console.error(`Error executing whitelist for ${file}:`, error);
        }
    }
    /*********************************************/
    /*********************************************/

    // save snapshot to .env
    const postWhitelistSnapshot = await network.provider.send("evm_snapshot", []);
    console.log("postWhitelistSnapshot: ", postWhitelistSnapshot);
    VirtualTestNet.addToEnvFile("TENDERLY_SNAPSHOT", postWhitelistSnapshot)
    // return base;
}

async function setGas() {
    let caller: SignerWithAddress;
    let manager: SignerWithAddress;
    let dummyOwnerOne: SignerWithAddress;
    let dummyOwnerTwo: SignerWithAddress;
    let dummyOwnerThree: SignerWithAddress;
    let security: SignerWithAddress;
    [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] =
        await ethers.getSigners();
    const provider = new ethers.providers.JsonRpcProvider(VIRTUAL_MAINNET_RPC);
    await provider.send("tenderly_setBalance", [
        caller.address,
        "0xDE0B6B3A7640000",
    ]);
    await provider.send("tenderly_setBalance", [
        manager.address,
        "0xDE0B6B3A7640000",
    ]);
    await provider.send("tenderly_setBalance", [
        security.address,
        "0xDE0B6B3A7640000",
    ]);
    await provider.send("tenderly_setBalance", [
        dummyOwnerOne.address,
        "0xDE0B6B3A7640000",
    ]);
}

function findPermissionsFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        throw new Error(`The directory ${dir} does not exist.`);
    }

    let results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(findPermissionsFiles(filePath));
        } else if (file === 'permissions.ts') {
            results.push(filePath);
        }
    }

    return results;
}

async function main() {
    // set directory for roles to src/roles 
    const rolesDirectory = path.join(__dirname, 'src', 'roles');

    // @audit add roles directory path to .env for more flexibility
    // const { ROLES_DIRECTORY } = process.env;
    // if (!ROLES_DIRECTORY) {
    //     throw new Error('ROLES_DIRECTORY is not set in the .env file');
    // }
    // await whitelistSafes(ROLES_DIRECTORY);
    await whitelistSafes(rolesDirectory);
}

main();