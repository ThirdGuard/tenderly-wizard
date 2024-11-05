// @ts-ignore
import { ethers, network } from "hardhat";
import VirtualTestNet from "./virtual-test-net";
import { ChainId } from "zodiac-roles-sdk";
import { deployAccessControlSystemV1 } from "./deploy-roles-v1";
import { deployAccessControlSystemV2 } from "./deploy-roles-v2";
import { RolesVersion } from "../utils/types";
import { setGas } from "../utils/util";
import config from "../env-config";

export async function deploySafesOnVnet(chainId: ChainId, rolesVersion: RolesVersion) {


    await setGas();
    let contractsAddr;
    let deployedSnapshot;

    let base: any;

    if (rolesVersion === 'v1') {
        const [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await ethers.getSigners();
        base = await deployAccessControlSystemV1(chainId, {
            proxied: true,
            managerEOAs: [manager.address],
            securityEOAs: [security.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [dummyOwnerOne.address, dummyOwnerTwo.address, dummyOwnerThree.address],
        });
    } else {
        // @note first PK is caller (_)
        const [_, sysAdmins, securityEOAs, managerEOAs] = await ethers.getSigners();
        base = await deployAccessControlSystemV2(chainId, {
            proxied: true,
            managerEOAs: [managerEOAs.address],
            securityEOAs: [securityEOAs.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [sysAdmins.address],
        });
    }

    deployedSnapshot = await network.provider.send("evm_snapshot", []);
    console.log("deployedSnapshot: ", deployedSnapshot);

    // add to .env
    VirtualTestNet.addToEnvFile('TENDERLY_SNAPSHOT', deployedSnapshot);
    VirtualTestNet.addToEnvFile('ACCESS_CONTROL_SAFE_ADDRESS', base?.acSafe);
    VirtualTestNet.addToEnvFile('INVESTMENT_SAFE_ADDRESS', base?.invSafe);
    VirtualTestNet.addToEnvFile('INVESTMENT_ROLES_ADDRESS', base?.invRoles);
    VirtualTestNet.addToEnvFile('ACCESS_CONTROL_ROLES_ADDRESS', base?.acRoles);

    contractsAddr = base;
    return base;
}

async function main() {
    const { ROLES_VERSION: rolesVersion } = config;
    console.log(`Deploying with roles version: ${rolesVersion}`);

    // @note tenderly fork ID defaults to 1 if not set in .env
    const chainId = config.TENDERLY_FORK_ID

    await deploySafesOnVnet(chainId as ChainId, rolesVersion as RolesVersion);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
