"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const terminal_kit_1 = require("terminal-kit");
const child_process_1 = require("child_process");
const virtual_test_net_1 = __importDefault(require("./scripts/virtual-test-net"));
const colors_1 = __importDefault(require("colors"));
const file_manipulation_1 = require("./utils/file-manipulation");
const rolesVersions = ["V1", "V2"];
async function getTestnetList() {
    terminal_kit_1.terminal.reset("========================\n");
    terminal_kit_1.terminal.black(" 🧙 TENDERLY WIZARD 🧙\n");
    terminal_kit_1.terminal.black("========================\n");
    const vnets = await virtual_test_net_1.default.listVirtualTestnets(); // Get the list of virtual testnets
    const testnets = vnets.map(vnet => " 🌐 " + vnet.displayName);
    testnets.unshift("\n");
    testnets.unshift(colors_1.default.blue("Select an existing Testnet:"));
    testnets.unshift("\n");
    testnets.unshift("========================");
    testnets.unshift(colors_1.default.green("➕ CREATE TESTNET"));
    testnets.unshift(colors_1.default.green("➕ CREATE TESTNET & SETUP"));
    testnets.push("\n");
    testnets.push("========================");
    testnets.push(colors_1.default.red("🛑 EXIT"));
    testnets.push("========================");
    // terminal.reset("========================");
    let testnet = await terminal_kit_1.terminal.singleColumnMenu(testnets).promise;
    console.log(testnet.selectedText = testnet.selectedText.replace(" 🌐 ", ""));
    if (testnet.selectedText == colors_1.default.red("🛑 EXIT") || testnet.selectedText == "\n" || testnet.selectedText == "========================" || testnet.selectedText == colors_1.default.blue("Select Testnet:")) {
        terminal_kit_1.terminal.processExit(0);
    }
    if (testnet.selectedText == colors_1.default.green("➕ CREATE TESTNET")) {
        const result = await createNewTestnet(terminal_kit_1.terminal);
        testnet.selectedText = result.testnetName;
        terminal_kit_1.terminal.processExit(0);
    }
    if (testnet.selectedText == colors_1.default.green("➕ CREATE TESTNET & SETUP")) {
        // create new testnet
        const result = await createNewTestnet(terminal_kit_1.terminal);
        testnet.selectedText = result.testnetName;
        // deploy safes
        const outputSafes = (0, child_process_1.execSync)(`npm run deploy:safes`, { stdio: 'pipe' }).toString();
        console.log(outputSafes);
        // apply whitelist
        const outputWhitelist = (0, child_process_1.execSync)(`npm run deploy:whitelist`, { stdio: 'pipe' }).toString();
        console.log(outputWhitelist);
        // save snapshot
        const outputSnapshot = (0, child_process_1.execSync)(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString();
        console.log(outputSnapshot);
        terminal_kit_1.terminal.processExit(0);
    }
    return testnet;
}
async function start() {
    // update target repo's package.json with scripts
    let scripts;
    if (!process.env.IS_DEV) {
        (0, file_manipulation_1.updatePackageJson)();
    }
    terminal_kit_1.terminal.grabInput(true);
    terminal_kit_1.terminal.on('key', (name, matches, data) => {
        if (name === 'ESCAPE') {
            terminal_kit_1.terminal.processExit(0);
        }
    });
    let testnet;
    testnet = await getTestnetList();
    const vnets = await virtual_test_net_1.default.listVirtualTestnets();
    const vnet = vnets.find(vnet => vnet.displayName == testnet.selectedText);
    terminal_kit_1.terminal.reset();
    console.log(`VIRTUAL_MAINNET_RPC=${vnet?.admin_rpc}`);
    console.log(`TENDERLY_TESTNET_UUID=${vnet?.vnet_id}`);
    console.log(`Select Action for ${testnet.selectedText}:`);
    const action = await terminal_kit_1.terminal.singleColumnMenu(["Fork", colors_1.default.red("Delete"), "Snapshot", "Activate", "Deploy Safes", "Apply Whitelist", colors_1.default.blue("Back")]).promise;
    // fork testnet
    if (action.selectedIndex == 0) {
        terminal_kit_1.terminal.reset("Enter the name of the fork name: ");
        const newTestnet = await terminal_kit_1.terminal.inputField().promise;
        console.log(`fork testnet: ${newTestnet}`);
        const result = await virtual_test_net_1.default.forkVirtualTestNet(vnet?.vnet_id, newTestnet);
        console.log(`Forked testnet: ${result.vnet_id}`);
    }
    // delete testnet
    if (action.selectedIndex == 1) {
        console.log("Are you sure you want to delete this testnet (Y/N):", testnet.selectedText);
        const confirmDelete = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDelete?.valueOf()) {
            await virtual_test_net_1.default.deleteVirtualTestNet(vnet?.vnet_id);
            console.log("Deleted testnet");
        }
        //go back to start, 
        goto: await start();
    }
    // save snapshot
    if (action.selectedIndex == 2) {
        // @note this function needs to be called from terminal in order to work (needs hardhat to fetch the snapshot)
        const output = (0, child_process_1.execSync)(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString();
        console.log(output);
    }
    // activate testnet 
    if (action.selectedIndex == 3) {
        // get vnet details
        const testNet = await virtual_test_net_1.default.getTestnet(testnet.selectedText);
        // // overwrite RPC, Testnet UUID and Fork ID in .env
        virtual_test_net_1.default.addToEnvFile('VIRTUAL_MAINNET_RPC', testNet?.admin_rpc ?? '');
        virtual_test_net_1.default.addToEnvFile('TENDERLY_TESTNET_UUID', testNet?.vnet_id ?? '');
        virtual_test_net_1.default.addToEnvFile('TENDERLY_FORK_ID', testNet?.network_id?.toString() ?? '1');
        // overwrite Snapshot in .env
        const output = (0, child_process_1.execSync)(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString();
        console.log(output);
        console.log(`Testnet ${testnet.selectedText} activated successfully`);
    }
    // deploy safes
    if (action.selectedIndex == 4) {
        // select roles version
        await selectRolesVersion(terminal_kit_1.terminal);
        // confirmation
        console.log("Are you sure you want to deploy default safes to this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nDeploying default safes...");
            const output = (0, child_process_1.execSync)(`npm run deploy:safes`, { stdio: 'pipe' }).toString();
            console.log(output);
            console.log("\nDeployed default safes successfully");
        }
    }
    if (action.selectedIndex == 5) {
        // select roles version
        await selectRolesVersion(terminal_kit_1.terminal);
        // confirmation
        console.log("Are you sure you want to apply whitelist to the default safes on this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDeploy?.valueOf()) {
            console.log("\nApplying whitelist...");
            // const output = execSync(`npm run deploy:whitelist`, { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }).toString()
            const output = executeWithLogs(`npm run deploy:whitelist && npm run save:vnet-snapshot`);
            console.log(output);
            if (!output.success) {
                console.error('Error details:', output.error);
                console.error('Error output:', output.output);
            }
            else {
                console.log("\nApplied whitelist successfully");
                // const output = execSync(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString()
                // console.log(output)
            }
        }
    }
    if (action.selectedIndex == 6) {
        goto: await start();
    }
    terminal_kit_1.terminal.processExit(0);
}
exports.start = start;
function executeWithLogs(command, options = {}) {
    try {
        // Merge default options with user provided options
        const defaultOptions = {
            encoding: 'utf8',
            stdio: 'pipe',
            maxBuffer: 1024 * 1024 * 10,
            ...options
        };
        // Execute the command and capture output
        const output = (0, child_process_1.execSync)(command, defaultOptions);
        return {
            success: true,
            output: (0, file_manipulation_1.stripAnsi)(output.toString()),
            error: null
        };
    }
    catch (error) {
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
async function createNewTestnet(terminal) {
    terminal.reset("Enter the name of the new testnet: ");
    const newTestnet = await terminal.inputField().promise;
    // select chain
    // @audit add more chains  
    terminal.yellow("\n\nSelect a Chain: \n");
    const chains = ["Ethereum", "Base", "Polygon"];
    const chainSelection = await terminal.singleColumnMenu(chains).promise;
    let chain = 1;
    if (chainSelection.selectedIndex == 1) {
        chain = 8453;
    }
    else if (chainSelection.selectedIndex == 2) {
        chain = 137;
    }
    // select roles version
    await selectRolesVersion(terminal);
    console.log(`create testnet: ${newTestnet}`);
    const result = await virtual_test_net_1.default.createVirtualTestNet(newTestnet, chain);
    // set env variables
    await virtual_test_net_1.default.addToEnvFile('TENDERLY_FORK_ID', chain.toString());
    // get snapshot
    const outputSnapshot = (0, child_process_1.execSync)(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString();
    console.log(outputSnapshot);
    return {
        testnetName: newTestnet,
        result
    };
}
async function selectRolesVersion(terminal) {
    terminal.red("Select roles version: ");
    const roleVersionSelection = await terminal.singleColumnMenu(rolesVersions).promise;
    // Default to v1
    let rolesVersion = 'v1';
    if (roleVersionSelection.selectedIndex == 1) {
        rolesVersion = 'v2';
    }
    // Update .env file
    await virtual_test_net_1.default.addToEnvFile('ROLES_VERSION', rolesVersion);
    return rolesVersion;
}
