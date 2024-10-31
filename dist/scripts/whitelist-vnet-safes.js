"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execute_whitelist_v2_1 = require("./execute-whitelist-v2");
const execute_whitelist_v1_1 = require("./execute-whitelist-v1");
async function main() {
    // @audit add roles directory path to .env for more flexibility
    // const { ROLES_DIRECTORY } = process.env;
    // if (!ROLES_DIRECTORY) {
    //     throw new Error('ROLES_DIRECTORY is not set in the .env file');
    // }
    // await whitelistSafes(ROLES_DIRECTORY);
    const { ROLES_VERSION } = process.env;
    console.log("ROLES_VERSION: ", ROLES_VERSION);
    if (ROLES_VERSION === "v1") {
        await (0, execute_whitelist_v1_1.whitelistSafesV1)();
    }
    else if (ROLES_VERSION === "v2") {
        await (0, execute_whitelist_v2_1.whitelistSafesV2)();
    }
}
main();
