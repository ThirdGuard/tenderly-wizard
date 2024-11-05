import { terminal } from 'terminal-kit';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import VirtualTestNet from './scripts/virtual-test-net';
import { updatePackageJson } from './utils/util';

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
        terminal.yellow("\n\nSelect a Chain: \n");
        const chains = ["Ethereum", "Base", "Polygon"];
        const chainSelection = await terminal.singleColumnMenu(chains).promise;

        let chain = 1
        if (chainSelection.selectedIndex == 1) {
            chain = 8453
        } else if (chainSelection.selectedIndex == 2) {
            chain = 137
        }
        console.log(`create testnet: ${newTestnet}`);
        const result = await VirtualTestNet.createVirtualTestNet(newTestnet as string, chain);
        testnet.selectedText = newTestnet as string;

        // set env variables
        await VirtualTestNet.addToEnvFile('TENDERLY_FORK_ID', chain.toString());
        terminal.processExit(0);
    }
    return testnet;
}

export async function start() {
    // update target repo's package.json with scripts
    let scripts;
    if (!process.env.IS_DEV) {
        updatePackageJson()
    }

    const rolesVersions = ["V1", "V2"];

    terminal.grabInput(true);
    terminal.on('key', (name: any, matches: any, data: any) => {
        if (name === 'ESCAPE') {
            terminal.processExit(0);
        }
    });

    let testnet: any;
    testnet = await getTestnetList();
    const vnets = await VirtualTestNet.listVirtualTestnets();
    const vnet = vnets.find(vnet => vnet.displayName == testnet.selectedText);

    terminal.reset();
    console.log(`VIRTUAL_MAINNET_RPC=${vnet?.admin_rpc}`);
    console.log(`TENDERLY_TESTNET_UUID=${vnet?.vnet_id}`);
    console.log(`Select Action for ${testnet.selectedText}:`);

    const action = await terminal.singleColumnMenu(["Fork", "Delete", "Snapshot", "Activate", "Deploy Safes", "Apply Whitelist", "Back"]).promise;

    // fork testnet
    if (action.selectedIndex == 0) {
        terminal.reset("Enter the name of the fork name: ");
        const newTestnet = await terminal.inputField().promise;
        console.log(`fork testnet: ${newTestnet}`);
        const result = await VirtualTestNet.forkVirtualTestNet(vnet?.vnet_id as string, newTestnet as string);
        console.log(`Forked testnet: ${result.vnet_id}`);
    }

    // delete testnet
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

    // save snapshot
    if (action.selectedIndex == 2) {
        // @note this function needs to be called from terminal in order to work (needs hardhat to fetch the snapshot)
        const output = execSync(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString()
        console.log(output)
    }

    // activate testnet 
    if (action.selectedIndex == 3) {
        // get vnet details
        const testNet = await VirtualTestNet.getTestnet(testnet.selectedText)

        // // overwrite RPC, Testnet UUID and Fork ID in .env
        VirtualTestNet.addToEnvFile('VIRTUAL_MAINNET_RPC', testNet?.admin_rpc ?? '')
        VirtualTestNet.addToEnvFile('TENDERLY_TESTNET_UUID', testNet?.vnet_id ?? '')
        VirtualTestNet.addToEnvFile('TENDERLY_FORK_ID', testNet?.network_id?.toString() ?? '1')

        // overwrite Snapshot in .env
        const output = execSync(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString()
        console.log(output)

        console.log(`Testnet ${testnet.selectedText} activated successfully`);
    }

    // deploy safes
    if (action.selectedIndex == 4) {
        // select roles version
        terminal.red("Select roles version: ")
        const roleVersionSelection = await terminal.singleColumnMenu(rolesVersions).promise;

        // apply roles V1
        let rolesVersion = 'v1'
        if (roleVersionSelection.selectedIndex == 1) {
            // apply roles v2
            rolesVersion = 'v2'
        }

        // set roles version in .env
        await VirtualTestNet.addToEnvFile('ROLES_VERSION', rolesVersion)

        // confirmation
        console.log("Are you sure you want to deploy default safes to this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nDeploying default safes...");
            const output = execSync(`npm run deploy:safes`, { stdio: 'pipe' }).toString()
            console.log(output)
            console.log("\nDeployed default safes successfully");
        }
    }

    if (action.selectedIndex == 5) {
        // select roles version
        terminal.red("Select roles version: ")
        const roleVersionSelection = await terminal.singleColumnMenu(rolesVersions).promise;

        // apply roles V1
        let rolesVersion = 'v1'
        if (roleVersionSelection.selectedIndex == 1) {
            // apply roles v2
            rolesVersion = 'v2'
        }

        // set roles version in .env
        await VirtualTestNet.addToEnvFile('ROLES_VERSION', rolesVersion)

        // confirmation
        console.log("Are you sure you want to apply whitelist to the default safes on this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nApplying whitelist...");
            // const output = execSync(`npm run deploy:whitelist`, { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }).toString()

            const output = executeWithLogs(`npm run deploy:whitelist && npm run save:vnet-snapshot`)
            console.log(output)
            if (!output.success) {
                console.error('Error details:', output.error);
                console.error('Error output:', output.output);
            } else {
                console.log("\nApplied whitelist successfully");

                // const output = execSync(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString()
                // console.log(output)
            }
        }
    }

    if (action.selectedIndex == 6) {
        goto: await start();
    }

    terminal.processExit(0);
}

function executeWithLogs(command: string, options = {}) {
    try {
        // Merge default options with user provided options
        const defaultOptions: ExecSyncOptionsWithStringEncoding = {
            encoding: 'utf8',
            stdio: 'pipe',
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            ...options
        };

        // Execute the command and capture output
        const output = execSync(command, defaultOptions);
        return {
            success: true,
            output,
            error: null
        };
    } catch (error: any) {
        // Capture detailed error information
        return {
            success: false,
            output: error.output ? error.output.toString() : null,
            error: {
                message: error.message,
                status: error.status,
                signal: error.signal,
                stderr: error.stderr ? error.stderr.toString() : null,
                stdout: error.stdout ? error.stdout.toString() : null,
                command: error.cmd
            }
        };
    }
}

// start();

