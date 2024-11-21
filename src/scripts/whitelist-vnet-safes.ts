import { whitelistSafesV2 } from "./execute-whitelist-v2";
import { whitelistSafesV1 } from "./execute-whitelist-v1";
import config from "../env-config";
import path from "path";

async function main() {
    // @audit add roles directory path to .env for more flexibility
    // const { ROLES_DIRECTORY } = config;
    // if (!ROLES_DIRECTORY) {
    //     throw new Error('ROLES_DIRECTORY is not set in the .env file');
    // }
    // await whitelistSafes(ROLES_DIRECTORY);

    const { ROLES_VERSION } = config;

    console.log("ROLES_VERSION: ", ROLES_VERSION);

    if (ROLES_VERSION === "v1") {
        await whitelistSafesV1();
    } else if (ROLES_VERSION === "v2") {
        await whitelistSafesV2();
    }
}

main();