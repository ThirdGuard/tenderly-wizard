// @ts-ignore
import { ethers, network } from "hardhat";
import VirtualTestNet from "./virtual-test-net";
import { ChainId } from "zodiac-roles-sdk";
import { deployAccessControlSystemV1 } from "./deploy-roles-v1";
import { deployAccessControlSystemV2 } from "./deploy-roles-v2";
import { RolesVersion } from "../utils/types";
import { setGas } from "../utils/util";

export async function deploySafesOnVnet(chainId: ChainId, rolesVersion: RolesVersion) {
    // @note first PK is caller (_)
    const [_, sysAdmins, securityEOAs, managerEOAs] = await ethers.getSigners();

    await setGas();
    let contractsAddr;
    let deployedSnapshot;

    let base: any;

    if (rolesVersion === 'v1') {
        base = await deployAccessControlSystemV1(chainId, {
            proxied: true,
            managerEOAs: [managerEOAs.address],
            securityEOAs: [securityEOAs.address],
            invSafeThreshold: 1,
            acSafeThreshold: 1,
            sysAdminAddresses: [sysAdmins.address],
        });
    } else {
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
    VirtualTestNet.addToEnvFile('ACCESS_CONTROL_SAFE', base?.acSafe);
    VirtualTestNet.addToEnvFile('INVESTMENT_SAFE', base?.invSafe);
    VirtualTestNet.addToEnvFile('INVESTMENT_ROLES', base?.invRoles);
    VirtualTestNet.addToEnvFile('ACCESS_CONTROL_ROLES', base?.acRoles);

    contractsAddr = base;
    return base;
}

async function main() {
    const { ROLES_VERSION: rolesVersion } = process.env;
    console.log(`Deploying with roles version: ${rolesVersion}`);

    // @note tenderly fork ID defaults to 1 if not set in .env
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || '1', 10)


    await deploySafesOnVnet(chainId as ChainId, rolesVersion as RolesVersion);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
