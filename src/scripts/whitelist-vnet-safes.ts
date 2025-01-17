import { whitelistSafesV2 } from "./deploy-whitelist-v2";
import { whitelistSafesV1 } from "./deploy-whitelist-v1";
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
