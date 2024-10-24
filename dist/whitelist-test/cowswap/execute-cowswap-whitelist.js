"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hw_app_eth_1 = __importStar(require("@ledgerhq/hw-app-eth"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const hw_transport_node_hid_1 = __importDefault(require("@ledgerhq/hw-transport-node-hid"));
const scope_cowswap_1 = require("./scope-cowswap");
// npx hardhat run src/whitelist/execute-pendle-ethena-whitelist.ts --network localhost
const run = async () => {
    console.log(`Start whitelisting USDE on ${hardhat_1.network.name}...`);
    if (!process.env.INVESTMENT_SAFE_ADDRESS || !process.env.ACCESS_CONTROL_ROLES_ADDRESS || !process.env.INVESTMENT_ROLES_ADDRESS) {
        throw new Error("Setup Safe & Roles Addresses in .env file");
    }
    if (!process.env.LEDGER_ACCOUNT_NUMBER) {
        throw new Error("Set the ledger account number in .env file");
    }
    //Configure ledger transport mode
    const transport = await hw_transport_node_hid_1.default.create();
    const eth = new hw_app_eth_1.default(transport);
    const addressDerivation = `44'/60'/${process.env.LEDGER_ACCOUNT_NUMBER}'/0/0`;
    const { address } = await eth.getAddress(addressDerivation, false);
    const ledgerSigner = await hardhat_1.ethers.getSigner(address);
    console.log("Getting Ledger Address...");
    console.log("Signing with Ledger Address:", address);
    // Cowswap whitelist class will gather all the necessary scoping and crafting of the multisend transaction
    const cowswapWhitelist = new scope_cowswap_1.CowswapWhitelist(process.env.INVESTMENT_ROLES_ADDRESS, ledgerSigner);
    // build() will construct the unsigned transaction
    const whitelistPopTx = await cowswapWhitelist.build(process.env.ACCESS_CONTROL_ROLES_ADDRESS, process.env.INVESTMENT_SAFE_ADDRESS);
    //We avoid using the hardhat provider as ledger signing only seems to work on hardhat localhost not live chains
    const provider = new hardhat_1.ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth');
    const estimatedGas = await provider.estimateGas(whitelistPopTx);
    //Build tx body for signing
    const unsignedTx = {
        to: whitelistPopTx.to,
        gasPrice: (await hardhat_1.ethers.provider.getGasPrice())._hex,
        gasLimit: estimatedGas,
        nonce: await hardhat_1.ethers.provider.getTransactionCount(address, "latest"),
        chainId: (await hardhat_1.ethers.provider.getNetwork()).chainId,
        data: whitelistPopTx.data,
    };
    //Setup Ledger requirements
    const defaultLoadConfig = {
        nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
        pluginBaseURL: "https://cdn.live.ledger.com",
        extraPlugins: null,
        cryptoassetsBaseURL: "https://cdn.live.ledger.com/cryptoassets"
    };
    const serializedTx = hardhat_1.ethers.utils.serializeTransaction(unsignedTx).slice(2);
    const resolution = await hw_app_eth_1.ledgerService.resolveTransaction(serializedTx, defaultLoadConfig, {});
    //Sign transaction
    const signature = await eth.signTransaction(addressDerivation, serializedTx, resolution);
    let sig = { ...signature };
    //Parse the signature
    sig.r = "0x" + signature.r;
    sig.s = "0x" + signature.s;
    sig.v = parseInt("0x" + signature.v);
    //Serialize the same transaction as before, but adding the signature on to it
    const signedTx = hardhat_1.ethers.utils.serializeTransaction(unsignedTx, sig);
    //Send the transaction
    const tx = await provider.sendTransaction(signedTx);
    const receipt = await tx.wait();
    console.log('Transaction hash:', receipt.transactionHash);
};
run();
