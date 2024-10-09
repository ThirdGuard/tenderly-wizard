import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as tenderly from "@tenderly/hardhat-tenderly";
import yargs from "yargs";
import dotenv from "dotenv";
import "hardhat-deploy";
import type { HttpNetworkUserConfig } from "hardhat/types";
// import "./src/scripts/tasks";

// tenderly.setup({ automaticVerifications: true });

const argv = yargs
    .option("network", {
        type: "string",
        default: "hardhat",
    })
    .help(false)
    .version(false).argv;

// Load environment variables.
dotenv.config();

const {
    INFURA_KEY,
    MNEMONIC,
    ETHERSCAN_API_KEY,
    PK,
    PK_ADDR,
    LEDGER_ADDRESS,
    WALLET_PK_1,
    WALLET_PK_2,
    WALLET_PK_3,
    WALLET_PK_4,
    WALLET_PK_5,
    WALLET_PK_6,
    WALLET_PK_7,
    WALLET_PK_8,
    WALLET_PK_9,
    WALLET_PK_10,
    VIRTUAL_MAINNET_RPC,
    TENDERLY_PROJECT_ID,
    TENDERLY_ACCOUNT,
} = process.env;

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PK) {
    (sharedNetworkConfig.accounts as any) = [
        PK,
        WALLET_PK_1,
        WALLET_PK_2,
        WALLET_PK_3,
        WALLET_PK_4,
        WALLET_PK_5,
        WALLET_PK_6,
        WALLET_PK_7,
        WALLET_PK_8,
        WALLET_PK_9,
        WALLET_PK_10,
    ];
    // sharedNetworkConfig.accounts = [PK];
}

const config: HardhatUserConfig = {
    paths: {
        artifacts: "build/artifacts",
        cache: "build/cache",
        deploy: "src/deploy",
        sources: "contracts",
    },
    solidity: {
        compilers: [
            { version: "0.8.6" },
            { version: "0.6.12" },
            {
                version: "0.8.21",
                settings: {
                    evmVersion: "shanghai",
                    optimizer: {
                        enabled: true,
                        runs: 100,
                    },
                },
            },
        ],
        settings: {
            optimizer: {
                enabled: true,
                runs: 1,
            },
        },
    },
    networks: {
        virtual_mainnet: {
            ...sharedNetworkConfig,
            url: VIRTUAL_MAINNET_RPC,
            chainId: 31337,
            // currency: "VETH"
            // ledgerAccounts: [
            //     LEDGER_ADDRESS as string
            // ]
        },
    },
    tenderly: {
        // https://docs.tenderly.co/account/projects/account-project-slug
        project: TENDERLY_PROJECT_ID as string,
        username: TENDERLY_ACCOUNT as string,
    },
    namedAccounts: {
        deployer: 0,
    },
    mocha: {
        timeout: 20000000,
    },
};

export default config;