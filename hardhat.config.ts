import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as tenderly from "@tenderly/hardhat-tenderly";
import yargs from "yargs";
import "hardhat-deploy";
import type { HttpNetworkUserConfig } from "hardhat/types";
import envConfig from "./src/env-config";

// tenderly.setup({ automaticVerifications: true });

const argv = yargs
    .option("network", {
        type: "string",
        default: "hardhat",
    })
    .help(false)
    .version(false).argv;

const {
    INFURA_KEY,
    MNEMONIC,
    ETHERSCAN_API_KEY,
    PK,
    PK_ADDR,
    LEDGER_ADDRESS,
    VIRTUAL_MAINNET_RPC,
    TENDERLY_PROJECT_ID,
    TENDERLY_ACCOUNT,
} = envConfig;

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PK) {
    (sharedNetworkConfig.accounts as any) = [
        PK,
        '0x6afd3b6cafa60dcc9c0d715aa19a6443e3f88870e42f1bdd6c2609eb28f1cb51',
        '0x63c78aab65242db8fb8673a83f327b7b64433e804cf321aa8222b82ad9b01f99',
        '0x49efed4ae9f6ae4fb1e4bb3271b6dd4afb03de67c108a277a13225c7658140c0',
        '0x76f45ae18000567fb4b532108456669c146cb25e17e3cc47e438c16c2c34b4aa',
        '0x51066e829f901ea6e603172cec18f3266279cdccb570ddd53f7ac1d3e0e68a58',
        '0x50350d949111914eb2e66d83c9279b5d69625c6d4e16d7b6a4fb6d3a2d382a83',
        '0x30e84f7988928307e38ef19ce9ca015eaf88bff19b642e2dd592d5b243eef47d',
        '0x6f64c3254768c76ea9d3964d0e7bf7bf6fa4f6ddae3ecbc57b7704b8a690b0c0',
        '0x9fddc1c886752a958228397040dde05c6d0fb0f2c07849910c1b076b6e67918c',
        '0xcca548821711dfe778fd40a51df06d775e9b8691551858b730caaa4af58ce2b0',
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