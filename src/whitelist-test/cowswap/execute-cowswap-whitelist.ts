import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
import { ethers } from "hardhat";
import hre from 'hardhat';
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { PendleEthenaWhitelist } from "./scope-pendle-ethena";
import { CowswapWhitelist } from './scope-cowswap';

// npx hardhat run src/whitelist/execute-pendle-ethena-whitelist.ts --network localhost
const run = async () => {
    console.log(`Start whitelisting USDE on ${hre.network.name}...`)
    if (!process.env.INVESTMENT_SAFE_ADDRESS || !process.env.ACCESS_CONTROL_ROLES_ADDRESS || !process.env.INVESTMENT_ROLES_ADDRESS) {
        throw new Error("Setup Safe & Roles Addresses in .env file")
    }
    if (!process.env.LEDGER_ACCOUNT_NUMBER) {
        throw new Error("Set the ledger account number in .env file")
    }

    //Configure ledger transport mode
    const transport = await TransportNodeHid.create();
    const eth = new Eth(transport);
    const addressDerivation = `44'/60'/${process.env.LEDGER_ACCOUNT_NUMBER}'/0/0`
    const { address } = await eth.getAddress(addressDerivation, false);
    const ledgerSigner = await ethers.getSigner(address)
    console.log("Getting Ledger Address...")
    console.log("Signing with Ledger Address:", address);

    // Cowswap whitelist class will gather all the necessary scoping and crafting of the multisend transaction
    const cowswapWhitelist = new CowswapWhitelist(process.env.INVESTMENT_ROLES_ADDRESS, ledgerSigner);
    // build() will construct the unsigned transaction
    const whitelistPopTx = await cowswapWhitelist.build(process.env.ACCESS_CONTROL_ROLES_ADDRESS, process.env.INVESTMENT_SAFE_ADDRESS);

    //We avoid using the hardhat provider as ledger signing only seems to work on hardhat localhost not live chains
    const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth')
    const estimatedGas = await provider.estimateGas(whitelistPopTx);

    //Build tx body for signing
    const unsignedTx = {
        to: whitelistPopTx.to,
        gasPrice: (await ethers.provider.getGasPrice())._hex,
        gasLimit: estimatedGas,
        nonce: await ethers.provider.getTransactionCount(address, "latest"),
        chainId: (await ethers.provider.getNetwork()).chainId,
        data: whitelistPopTx.data,
    }

    //Setup Ledger requirements
    const defaultLoadConfig = {
        nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
        pluginBaseURL: "https://cdn.live.ledger.com",
        extraPlugins: null,
        cryptoassetsBaseURL: "https://cdn.live.ledger.com/cryptoassets"
    };

    const serializedTx = ethers.utils.serializeTransaction(unsignedTx).slice(2);
    const resolution = await ledgerService.resolveTransaction(serializedTx, defaultLoadConfig, {});

    //Sign transaction
    const signature = await eth.signTransaction(
        addressDerivation,
        serializedTx,
        resolution
    );
    let sig: any = { ...signature }

    //Parse the signature
    sig.r = "0x" + signature.r;
    sig.s = "0x" + signature.s;
    sig.v = parseInt("0x" + signature.v);

    //Serialize the same transaction as before, but adding the signature on to it
    const signedTx = ethers.utils.serializeTransaction(unsignedTx, sig);
    //Send the transaction
    const tx = await provider.sendTransaction(signedTx)
    const receipt = await tx.wait();
    console.log('Transaction hash:', receipt.transactionHash);
}

run()