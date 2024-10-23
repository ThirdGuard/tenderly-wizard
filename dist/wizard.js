"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const terminal_kit_1 = require("terminal-kit");
const child_process_1 = require("child_process");
const virtual_test_net_1 = __importDefault(require("./scripts/virtual-test-net")); // Import the VirtualTestNet class
const util_1 = require("./utils/util");
async function getTestnetList() {
    const vnets = await virtual_test_net_1.default.listVirtualTestnets(); // Get the list of virtual testnets
    const testnets = vnets.map(vnet => vnet.displayName);
    testnets.push("+CREATE TESTNET+");
    testnets.push("-EXIT-");
    terminal_kit_1.terminal.reset("Select Testnet:");
    const testnet = await terminal_kit_1.terminal.singleColumnMenu(testnets).promise;
    if (testnet.selectedText == "-EXIT-") {
        terminal_kit_1.terminal.processExit(0);
    }
    if (testnet.selectedText == "+CREATE TESTNET+") {
        terminal_kit_1.terminal.reset("Enter the name of the new testnet: ");
        const newTestnet = await terminal_kit_1.terminal.inputField().promise;
        // selet chain
        // @audit add more chains
        terminal_kit_1.terminal.red("Select a Chain: \n");
        const chains = ["Ethereum", "Base", "Polygon"];
        const chainSelection = await terminal_kit_1.terminal.singleColumnMenu(chains).promise;
        let chain = 1;
        if (chainSelection.selectedIndex == 1) {
            chain = 8453;
        }
        else if (chainSelection.selectedIndex == 2) {
            chain = 137;
        }
        console.log(`create testnet: ${newTestnet}`);
        const result = await virtual_test_net_1.default.createVirtualTestNet(newTestnet, chain);
        testnet.selectedText = newTestnet;
        // set env variables
        await virtual_test_net_1.default.addToEnvFile('TENDERLY_FORK_ID', chain.toString());
        terminal_kit_1.terminal.processExit(0);
    }
    return testnet;
}
async function start() {
    var _a, _b, _c, _d;
    // update target repo's package.json with scripts
    (0, util_1.updatePackageJson)();
    const rolesVersions = ["V1", "V2"];
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
    console.log(`VIRTUAL_MAINNET_RPC=${vnet === null || vnet === void 0 ? void 0 : vnet.admin_rpc}`);
    console.log(`TENDERLY_TESTNET_UUID=${vnet === null || vnet === void 0 ? void 0 : vnet.vnet_id}`);
    console.log(`Select Action for ${testnet.selectedText}:`);
    const action = await terminal_kit_1.terminal.singleColumnMenu(["Fork", "Delete", "Snapshot", "Activate", "Deploy Safes", "Apply Whitelist", "Back"]).promise;
    // fork testnet
    if (action.selectedIndex == 0) {
        terminal_kit_1.terminal.reset("Enter the name of the fork name: ");
        const newTestnet = await terminal_kit_1.terminal.inputField().promise;
        console.log(`fork testnet: ${newTestnet}`);
        const result = await virtual_test_net_1.default.forkVirtualTestNet(vnet === null || vnet === void 0 ? void 0 : vnet.vnet_id, newTestnet);
        console.log(`Forked testnet: ${result.vnet_id}`);
    }
    // delete testnet
    if (action.selectedIndex == 1) {
        console.log("Are you sure you want to delete this testnet (Y/N):", testnet.selectedText);
        const confirmDelete = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDelete === null || confirmDelete === void 0 ? void 0 : confirmDelete.valueOf()) {
            await virtual_test_net_1.default.deleteVirtualTestNet(vnet === null || vnet === void 0 ? void 0 : vnet.vnet_id);
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
        virtual_test_net_1.default.addToEnvFile('VIRTUAL_MAINNET_RPC', (_a = testNet === null || testNet === void 0 ? void 0 : testNet.admin_rpc) !== null && _a !== void 0 ? _a : '');
        virtual_test_net_1.default.addToEnvFile('TENDERLY_TESTNET_UUID', (_b = testNet === null || testNet === void 0 ? void 0 : testNet.vnet_id) !== null && _b !== void 0 ? _b : '');
        virtual_test_net_1.default.addToEnvFile('TENDERLY_FORK_ID', (_d = (_c = testNet === null || testNet === void 0 ? void 0 : testNet.network_id) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : '1');
        // overwrite Snapshot in .env
        const output = (0, child_process_1.execSync)(`npm run save:vnet-snapshot`, { stdio: 'pipe' }).toString();
        // log terminal output
        console.log(output);
        console.log(`Testnet ${testnet.selectedText} activated successfully`);
    }
    // deploy safes
    if (action.selectedIndex == 4) {
        // select roles version
        terminal_kit_1.terminal.red("Select roles version: ");
        const roleVersionSelection = await terminal_kit_1.terminal.singleColumnMenu(rolesVersions).promise;
        // apply roles V1
        let rolesVersion = 'v1';
        if (roleVersionSelection.selectedIndex == 1) {
            // apply roles v2
            rolesVersion = 'v2';
        }
        // set roles version in .env
        await virtual_test_net_1.default.addToEnvFile('ROLES_VERSION', rolesVersion);
        // confirmation
        console.log("Are you sure you want to deploy default safes to this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDeploy === null || confirmDeploy === void 0 ? void 0 : confirmDeploy.valueOf()) {
            console.log("\nDeploying default safes...");
            const output = (0, child_process_1.execSync)(`npm run deploy:vnet`, { stdio: 'pipe' }).toString();
            console.log(output);
            console.log("\nDeployed default safes successfully");
        }
    }
    if (action.selectedIndex == 5) {
        // select roles version
        terminal_kit_1.terminal.red("Select roles version: ");
        const roleVersionSelection = await terminal_kit_1.terminal.singleColumnMenu(rolesVersions).promise;
        // apply roles V1
        let rolesVersion = 'v1';
        if (roleVersionSelection.selectedIndex == 1) {
            // apply roles v2
            rolesVersion = 'v2';
        }
        // set roles version in .env
        await virtual_test_net_1.default.addToEnvFile('ROLES_VERSION', rolesVersion);
        // confirmation
        console.log("Are you sure you want to apply whitelist to the default safes on this testnet (Y/N):", testnet.selectedText);
        const confirmDeploy = await terminal_kit_1.terminal.yesOrNo().promise;
        if (confirmDeploy === null || confirmDeploy === void 0 ? void 0 : confirmDeploy.valueOf()) {
            console.log("\nApplying whitelist...");
            const output = (0, child_process_1.execSync)(`npm run deploy:whitelist`, { stdio: 'pipe' }).toString();
            console.log(output);
            console.log("\nApplied whitelist successfully");
        }
    }
    if (action.selectedIndex == 6) {
        goto: await start();
    }
    terminal_kit_1.terminal.processExit(0);
}
exports.start = start;
// start();
