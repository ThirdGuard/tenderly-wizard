import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
// @ts-ignore
import { ethers, network } from "hardhat";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { PendleUsd0Whitelist } from "./scope-pendle-usd0";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// npx hardhat run src/whitelist/execute-pendle-ethena-whitelist.ts --network localhost
const run = async () => {
    console.log(`Start whitelisting USD0++ PT on ${network.name}...`)
    if (!process.env.INVESTMENT_SAFE_ADDRESS || !process.env.ACCESS_CONTROL_ROLES_ADDRESS || !process.env.INVESTMENT_ROLES_ADDRESS) {
        throw new Error("Setup Safe & Roles Addresses in .env file")
    }

    const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth')
    const [signer] = await ethers.getSigners()
    // Pendle Ethena whitelist class will gather all the necessary scoping and crafting of the multisend transaction
    const pendleUsd0WhitelistSecurity = new PendleUsd0Whitelist(process.env.INVESTMENT_ROLES_ADDRESS, signer);
    // build() will construct the unsigned transaction
    const whitelistPopTx = await pendleUsd0WhitelistSecurity.build(process.env.ACCESS_CONTROL_ROLES_ADDRESS, process.env.INVESTMENT_SAFE_ADDRESS);

    //We avoid using the hardhat provider as ledger signing only seems to work on hardhat localhost not live chains
    const estimatedGas = await provider.estimateGas(whitelistPopTx);
    // console.log("GAS", estimatedGas)

    //send tx
    const sentTx = await signer.sendTransaction(whitelistPopTx);
    console.log('Transaction sent:', sentTx.hash);
    const receipt = await sentTx.wait();
    console.log('Transaction mined in block:', receipt.blockNumber);
    console.log('Transaction hash:', receipt.transactionHash);
}

run()