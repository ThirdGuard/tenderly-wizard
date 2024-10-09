import { terminal } from 'terminal-kit';
import { outputFile, remove } from 'fs-extra';
import { join } from 'path';
import { execSync } from 'child_process';
import VirtualTestNet, { VirtualTestNet as vtn } from './create-vnet'; // Import the VirtualTestNet class
// import { network } from 'hardhat';

async function getTestnetList() {
    const vnets = await VirtualTestNet.listVirtualTestnets(); // Get the list of virtual testnets
    const testnets = vnets.map(vnet => vnet.displayName);
    testnets.push("+CREATE TESTNET+");
    testnets.push("-EXIT-")
    terminal.reset("Select Testnet:");
    const testnet = await terminal.singleColumnMenu(testnets).promise;
    if (testnet.selectedText == "-EXIT-") {
        terminal.processExit(0);
    }
    if (testnet.selectedText == "+CREATE TESTNET+") {
        terminal.reset("Enter the name of the new testnet: ");
        const newTestnet = await terminal.inputField().promise;

        // selet chain
        // @audit add more chains
        terminal.red("Select a Chain: \n");
        const chains = ["Ethereum", "Base", "Polygon"];
        const chainSelection = await terminal.singleColumnMenu(chains).promise;

        let chain = 1
        // if (chainSelection.selectedIndex == 0) {
        //     chain = 1
        // }
        if (chainSelection.selectedIndex == 1) {
            chain = 8453
        } else if (chainSelection.selectedIndex == 2) {
            chain = 137
        }
        console.log(`create testnet: ${newTestnet}`);
        const result = await VirtualTestNet.createVirtualTestNet(newTestnet as string, chain);
        testnet.selectedText = newTestnet as string;

        // set env variables
        await vtn.addToEnvFile('TENDERLY_FORK_ID', chain.toString());
        terminal.processExit(0);
    }
    return testnet;
}

export async function start() {
    terminal.grabInput(true);
    terminal.on('key', (name: any, matches: any, data: any) => {
        if (name === 'ESCAPE') {
            terminal.processExit(0);
        }
    });

    let testnet: any;
    // starts: {
    testnet = await getTestnetList();
    const vnets = await VirtualTestNet.listVirtualTestnets();
    const vnet = vnets.find(vnet => vnet.displayName == testnet.selectedText);
    // }
    terminal.reset();
    console.log(`VIRTUAL_MAINNET_RPC=${vnet?.admin_rpc}`);
    console.log(`TESTNET_UUID=${vnet?.vnet_id}`);
    console.log(`Select Action for ${testnet.selectedText}:`);
    const action = await terminal.singleColumnMenu(["Fork", "Delete", "Snapshot", "Overwrite .env", "Deploy Safes", "Apply Whitelist", "Back"]).promise;

    if (action.selectedIndex == 0) {
        terminal.reset("Enter the name of the fork name: ");
        const newTestnet = await terminal.inputField().promise;
        console.log(`fork testnet: ${newTestnet}`);
        const result = await VirtualTestNet.forkVirtualTestNet(vnet?.vnet_id as string, newTestnet as string);
        console.log(`Forked testnet: ${result.vnet_id}`);
    }
    if (action.selectedIndex == 1) {
        console.log("Are you sure you want to delete this testnet (Y/N):", testnet.selectedText);
        const confirmDelete = await terminal.yesOrNo().promise;
        if (confirmDelete?.valueOf()) {
            await VirtualTestNet.deleteVirtualTestNet(vnet?.vnet_id as string);
            console.log("Deleted testnet");
        }
        //go back to start, 
        goto: await start();
    }
    if (action.selectedIndex == 2) {
        // get snapshot
        // const snapshot = await network.provider.send("evm_snapshot", []);

        // // Write snapshot to .env using VirtualTestNet.addToEnvFile function
        // await vtn.addToEnvFile('TENDERLY_SNAPSHOT', snapshot);
        // console.log(`Snapshot ${snapshot} written to .env file`);
    }

    //@todo overwrite .env
    if (action.selectedIndex == 3) {

    }

    // deploy safes
    if (action.selectedIndex == 4) {
        console.log("Are you sure you want to deploy default safes to this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nDeploying default safes...");
            execSync('npm run deploy:vnet')
            console.log("\nDeployed default safes successfully");
        }
        // close app
        terminal.processExit(0);
    }

    if (action.selectedIndex == 5) {
        console.log("Are you sure you want to apply whitelist to the default safes on this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nApplying whitelist...");
            execSync('npm run deploy:whitelist')
            console.log("\nApplied whitelist successfully");
        }
        // close app
        terminal.processExit(0);
    }

    if (action.selectedIndex == 6) {
        goto: await start();
    }

    terminal.processExit(0);
}

// start();