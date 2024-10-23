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
const { VIRTUAL_MAINNET_RPC } = process.env;
async function deploySafesOnVnet(chainId, rolesVersion) {
    const [sysAdmins, securityEOAs, managerEOAs] = await hardhat_1.ethers.getSigners();
    await (0, util_1.setGas)();
    let contractsAddr;
    let deployedSnapshot;
    console.log(`Deploying with roles version: ${rolesVersion}`);
    let base;
    if (rolesVersion === 'v1') {
        console.log("Deploying with roles version: v1");
        base = await (0, deploy_roles_v1_1.deployAccessControlSystemV1)(chainId, {
            proxied: true,
            managerEOAs: [managerEOAs.address],
            securityEOAs: [securityEOAs.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [sysAdmins.address],
        });
    }
    else {
        console.log("Deploying with roles version: v2");
        base = await (0, deploy_roles_v2_1.deployAccessControlSystemV2)(chainId, {
            proxied: true,
            managerEOAs: [managerEOAs.address],
            securityEOAs: [securityEOAs.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [sysAdmins.address],
        });
    }
    deployedSnapshot = await hardhat_1.network.provider.send("evm_snapshot", []);
    console.log("deployedSnapshot: ", deployedSnapshot);
    // add to .env
    virtual_test_net_1.default.addToEnvFile('TENDERLY_SNAPSHOT', deployedSnapshot);
    virtual_test_net_1.default.addToEnvFile('ACCESS_CONTROL_SAFE', base === null || base === void 0 ? void 0 : base.acSafe);
    virtual_test_net_1.default.addToEnvFile('INVESTMENT_SAFE', base === null || base === void 0 ? void 0 : base.invSafe);
    virtual_test_net_1.default.addToEnvFile('INVESTMENT_ROLES', base === null || base === void 0 ? void 0 : base.invRoles);
    virtual_test_net_1.default.addToEnvFile('ACCESS_CONTROL_ROLES', base === null || base === void 0 ? void 0 : base.acRoles);
    contractsAddr = base;
    return base;
}
exports.deploySafesOnVnet = deploySafesOnVnet;
async function main() {
    const { ROLES_VERSION: rolesVersion } = process.env;
    console.log(`Deploying with roles version: ${rolesVersion}`);
    // @note tenderly fork ID defaults to 1 if not set in .env
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || '1', 10);
    await deploySafesOnVnet(chainId, rolesVersion);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
