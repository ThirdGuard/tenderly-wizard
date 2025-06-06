import { whitelistSafesV2 } from "./execute-whitelist-v2-all";
import { whitelistSafesV1 } from "./execute-whitelist-v1-all";
import config from "../env-config";

async function main() {
  const { ROLES_VERSION } = config;

  console.log("ROLES_VERSION: ", ROLES_VERSION);

  if (ROLES_VERSION === "v1") {
    await whitelistSafesV1("../access-control-safes/src/whitelist");
  } else if (ROLES_VERSION === "v2") {
    await whitelistSafesV2("../access-control-safes-v2/src/roles");
  }
}

main();
