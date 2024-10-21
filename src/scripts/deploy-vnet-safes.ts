import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployAccessControlSystemV2 } from "./deploy-roles-v2";
// @ts-ignore
import { ethers, network } from "hardhat";
import VirtualTestNet from "./create-vnet";
import { ChainId } from "zodiac-roles-sdk";
import { deployAccessControlSystemV1 } from "./deploy-roles-v1";
import { RolesVersion } from "../utils/types";

const { VIRTUAL_MAINNET_RPC } = process.env;

export async function deploySafesOnVnet(chainId: ChainId, rolesVersion: RolesVersion) {
    const [sysAdmins, securityEOAs, managerEOAs] = await ethers.getSigners();

    await setGas();
    let contractsAddr;
    let deployedSnapshot;

    console.log(`Deploying with roles version: ${rolesVersion}`);

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

async function setGas() {
    let caller: SignerWithAddress;
    let manager: SignerWithAddress;
    let dummyOwnerOne: SignerWithAddress;
    let dummyOwnerTwo: SignerWithAddress;
    let dummyOwnerThree: SignerWithAddress;
    let security: SignerWithAddress;
    [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await ethers.getSigners();
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

async function main() {
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || '1', 10)
    // @note tenderly fork ID defaults to 1 if not set in .env


    // @todo get roles version from node args
    // Get roles version from node args
    const rolesVersion = process.argv.find(arg => arg.startsWith('--roles-version=')).split('=')[1];

    if (!rolesVersion || (rolesVersion !== 'v1' && rolesVersion !== 'v2')) {
        console.error('Invalid or missing roles version. Please specify --roles-version=v1 or --roles-version=v2');
        process.exit(1);
    }

    console.log(`Deploying with roles version: ${rolesVersion}`);

    // await deploySafesOnVnet(chainId as ChainId, rolesVersion);
}

main();