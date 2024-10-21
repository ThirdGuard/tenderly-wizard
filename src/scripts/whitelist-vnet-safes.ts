import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// @ts-ignore
import { ethers, network } from "hardhat";
import VirtualTestNet from "../create-vnet";
import { ChainId } from "zodiac-roles-sdk";
import { executeWhitelistV2 } from "../src/whitelist/whitelist-class";

const { VIRTUAL_MAINNET_RPC } = process.env;

export async function whitelistSafes() {
    // @todo get file fromt node args
    const input = process.argv.find(arg => arg.startsWith('--input=')).split('=')[1];

    if (!input) {
        console.error('No input file specified');
        process.exit(1);
    }

    // set gas for all accounts
    await setGas();

    // get chain
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || '1', 10) as ChainId

    /* @note add all whilist execution code here */
    /*********************************************/

    switch (chainId) {
        case 1:
            // eth whitelists
            break;
        case 8453:
            // base whitelists
            // aerodrome 
            // await executeWhitelistV2(aerodromePermissions, chainId)
            break;
        case 137:
            // polygon whitelists
            break;
        default:
            break;
    }

    /*********************************************/
    /*********************************************/

    // save snapshot to .env
    const postWhitelistSnapshot = await network.provider.send("evm_snapshot", []);
    console.log("postWhitelistSnapshot: ", postWhitelistSnapshot);
    VirtualTestNet.addToEnvFile("TENDERLY_SNAPSHOT", postWhitelistSnapshot)
    // return base;
}

async function setGas() {
    let caller: SignerWithAddress;
    let manager: SignerWithAddress;
    let dummyOwnerOne: SignerWithAddress;
    let dummyOwnerTwo: SignerWithAddress;
    let dummyOwnerThree: SignerWithAddress;
    let security: SignerWithAddress;
    [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] =
        await ethers.getSigners();
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
    await whitelistSafes();
}

main();