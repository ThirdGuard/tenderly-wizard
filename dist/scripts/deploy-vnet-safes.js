"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploySafesOnVnet = void 0;
// @ts-ignore
const hardhat_1 = require("hardhat");
const virtual_test_net_1 = __importDefault(require("./virtual-test-net"));
const deploy_roles_v1_1 = require("./deploy-roles-v1");
const deploy_roles_v2_1 = require("./deploy-roles-v2");
const util_1 = require("../utils/util");
const env_config_1 = __importDefault(require("../env-config"));
async function deploySafesOnVnet(chainId, rolesVersion) {
    await (0, util_1.setGas)();
    let contractsAddr;
    let deployedSnapshot;
    let base;
    const [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await hardhat_1.ethers.getSigners();
    if (rolesVersion === 'v1') {
        base = await (0, deploy_roles_v1_1.deployAccessControlSystemV1)(chainId, {
            proxied: true,
            managerEOAs: [manager.address],
            securityEOAs: [security.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [dummyOwnerOne.address, dummyOwnerTwo.address, dummyOwnerThree.address],
        });
    }
    else {
        base = await (0, deploy_roles_v2_1.deployAccessControlSystemV2)(chainId, {
            proxied: true,
            managerEOAs: [manager.address],
            securityEOAs: [security.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [dummyOwnerOne.address, dummyOwnerTwo.address, dummyOwnerThree.address],
        });
    }
    deployedSnapshot = await hardhat_1.network.provider.send("evm_snapshot", []);
    console.log("deployedSnapshot: ", deployedSnapshot);
    // add to .env
    virtual_test_net_1.default.addToEnvFile('TENDERLY_SNAPSHOT', deployedSnapshot);
    virtual_test_net_1.default.addToEnvFile('ACCESS_CONTROL_SAFE_ADDRESS', base?.acSafe);
    virtual_test_net_1.default.addToEnvFile('INVESTMENT_SAFE_ADDRESS', base?.invSafe);
    virtual_test_net_1.default.addToEnvFile('INVESTMENT_ROLES_ADDRESS', base?.invRoles);
    virtual_test_net_1.default.addToEnvFile('ACCESS_CONTROL_ROLES_ADDRESS', base?.acRoles);
    contractsAddr = base;
    return base;
}
exports.deploySafesOnVnet = deploySafesOnVnet;
async function main() {
    const { ROLES_VERSION: rolesVersion } = env_config_1.default;
    console.log(`Deploying with roles version: ${rolesVersion}`);
    // @note tenderly fork ID defaults to 1 if not set in .env
    const chainId = env_config_1.default.TENDERLY_FORK_ID;
    await deploySafesOnVnet(chainId, rolesVersion);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
