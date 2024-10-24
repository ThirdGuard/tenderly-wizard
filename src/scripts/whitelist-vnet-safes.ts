import { whitelistSafesV2 } from "./execute-whitelist-v2";
import { whitelistSafesV1 } from "./execute-whitelist-v1";

async function main() {
    // @audit add roles directory path to .env for more flexibility
    // const { ROLES_DIRECTORY } = process.env;
    // if (!ROLES_DIRECTORY) {
    //     throw new Error('ROLES_DIRECTORY is not set in the .env file');
    // }
    // await whitelistSafes(ROLES_DIRECTORY);

    const { ROLES_VERSION } = process.env;

    if (ROLES_VERSION === "v1") {
        await whitelistSafesV1();
    } else if (ROLES_VERSION === "v2") {
        await whitelistSafesV2();
    }
}

main();