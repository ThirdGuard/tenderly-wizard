"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePackageJson = exports.checkRequiredEnvVariables = exports.findWhitelistClasses = exports.findPermissionsFiles = exports.setGas = exports.setERC20TokenBalance = exports.setERC20TokenBalances = exports.encodeBytes32String = exports.numberToBytes32 = exports.getABICodedAddress = exports.scopeAllowFunctions = exports.scopeTargets = exports.getPreValidatedSignatures = exports.createMultisendTx = exports.ExecutionOptions = exports.OperationType = void 0;
const ethers_1 = require("ethers");
const ethers_multisend_1 = require("ethers-multisend");
const utils_1 = require("ethers/lib/utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const ts_morph_1 = require("ts-morph");
const child_process_1 = require("child_process");
var OperationType;
(function (OperationType) {
    OperationType[OperationType["Call"] = 0] = "Call";
    OperationType[OperationType["DelegateCall"] = 1] = "DelegateCall";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
var ExecutionOptions;
(function (ExecutionOptions) {
    ExecutionOptions[ExecutionOptions["None"] = 0] = "None";
    ExecutionOptions[ExecutionOptions["Send"] = 1] = "Send";
    ExecutionOptions[ExecutionOptions["DelegateCall"] = 2] = "DelegateCall";
    ExecutionOptions[ExecutionOptions["Both"] = 3] = "Both";
})(ExecutionOptions = exports.ExecutionOptions || (exports.ExecutionOptions = {}));
// Encodes multiple transactions so we can then use a Safe with multisend for atomic transacting
function createMultisendTx(populatedTxs, multisendAddr) {
    // console.log("encoding data");
    const safeTransactionData = populatedTxs.map((popTx) => ({
        to: popTx.to,
        value: popTx.value ? popTx.value.toString() : "0",
        data: popTx.data,
    }));
    // console.log({ safeTransactionData });
    return (0, ethers_multisend_1.encodeMulti)(safeTransactionData, multisendAddr);
}
exports.createMultisendTx = createMultisendTx;
// When we have a single owner on a safe, the output of this function can be used as the signature parameter on a execTransaction call on a safe
const getPreValidatedSignatures = (from, initialString = "0x") => {
    return `${initialString}000000000000000000000000${from.replace("0x", "")}000000000000000000000000000000000000000000000000000000000000000001`;
};
exports.getPreValidatedSignatures = getPreValidatedSignatures;
// roles.scopeTarget helper function
async function scopeTargets(targetAddrs, roleId, roles) {
    const scopeTargetTxs = await Promise.all(targetAddrs.map(async (target) => {
        //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
        const tx = await roles.populateTransaction.scopeTarget(roleId, target);
        return tx;
    }));
    return scopeTargetTxs;
}
exports.scopeTargets = scopeTargets;
// Helper to allows function calls without param scoping
async function scopeAllowFunctions(target, sigs, roleId, roles) {
    const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
        // allowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await roles.populateTransaction.allowFunction(roleId, target, sig, ExecutionOptions.Both);
        return tx;
    }));
    return scopeFuncsTxs;
}
exports.scopeAllowFunctions = scopeAllowFunctions;
const getABICodedAddress = (address) => ethers_1.utils.defaultAbiCoder.encode(["address"], [address]);
exports.getABICodedAddress = getABICodedAddress;
function numberToBytes32(num) {
    // Convert the number to a hex string
    let hexString = ethers_1.utils.hexlify(num);
    // Remove the "0x" prefix
    hexString = hexString.slice(2);
    // Pad the hex string to make sure it's 64 characters long (32 bytes)
    const paddedHexString = hexString.padStart(64, "0");
    // Add the "0x" prefix back
    return `0x${paddedHexString}`;
}
exports.numberToBytes32 = numberToBytes32;
exports.encodeBytes32String = utils_1.formatBytes32String;
const setERC20TokenBalances = async (tokenAddresses, recipient, amount) => tokenAddresses.forEach(async (tokenAddress) => await (0, exports.setERC20TokenBalance)(tokenAddress, recipient, amount));
exports.setERC20TokenBalances = setERC20TokenBalances;
const setERC20TokenBalance = async (token, address, amount) => {
    const value = ethers_1.BigNumber.from(amount).toHexString();
    await hardhat_1.network.provider.request({
        method: "tenderly_setErc20Balance",
        params: [token, address, value.replace("0x0", "0x")],
    });
};
exports.setERC20TokenBalance = setERC20TokenBalance;
async function setGas() {
    const { VIRTUAL_MAINNET_RPC } = process.env;
    let caller;
    let manager;
    let dummyOwnerOne;
    let dummyOwnerTwo;
    let dummyOwnerThree;
    let security;
    [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await hardhat_1.ethers.getSigners();
    const provider = new hardhat_1.ethers.providers.JsonRpcProvider(VIRTUAL_MAINNET_RPC);
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
exports.setGas = setGas;
function findPermissionsFiles(dir) {
    if (!fs_1.default.existsSync(dir)) {
        throw new Error(`The directory ${dir} does not exist.`);
    }
    let results = [];
    const files = fs_1.default.readdirSync(dir);
    for (const file of files) {
        const filePath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(findPermissionsFiles(filePath));
        }
        else if (file === 'permissions.ts') {
            results.push(filePath);
        }
    }
    return results;
}
exports.findPermissionsFiles = findPermissionsFiles;
function findWhitelistClasses(whitelistDir) {
    const project = new ts_morph_1.Project();
    // Add all TypeScript files from the whitelist directory to the project
    fs_1.default.readdirSync(whitelistDir, { recursive: true }).forEach(file => {
        if (typeof file === 'string' && file.endsWith('.ts')) {
            project.addSourceFileAtPath(path_1.default.join(whitelistDir, file));
        }
    });
    const whitelistExtensions = [];
    // Iterate through all source files
    project.getSourceFiles().forEach(sourceFile => {
        // Find all class declarations in the file
        const classes = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ClassDeclaration);
        classes.forEach((classDeclaration) => {
            const heritage = classDeclaration.getHeritageClauses();
            // Check if the class extends Whitelist
            if (heritage.some(clause => clause.getTypeNodes().some(node => node.getText().includes('Whitelist')))) {
                whitelistExtensions.push(classDeclaration.getName() || 'AnonymousClass');
            }
        });
    });
    console.log('Classes extending Whitelist:', whitelistExtensions);
    return whitelistExtensions;
}
exports.findWhitelistClasses = findWhitelistClasses;
function checkRequiredEnvVariables(requiredVariables) {
    const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);
    console.log({ missingVariables });
    if (missingVariables.length > 0) {
        console.log(`Missing required environment variables: ${missingVariables.join(", ")}`);
        return false;
    }
    console.log("All required environment variables are present.");
    return true;
}
exports.checkRequiredEnvVariables = checkRequiredEnvVariables;
function updatePackageJson() {
    // get the path of the tenderly-wizard package
    const tenderlyWizardPath = (0, child_process_1.execSync)('which tenderly-wizard').toString().trim();
    console.log("tenderlyWizardPath: ", tenderlyWizardPath);
    const appPath = (0, child_process_1.execSync)(`readlink -f ${tenderlyWizardPath}`).toString().trim().replace(/(.*tenderly-wizard).*/, '$1');
    console.log("appPath: ", appPath);
    // /Users/michaellungu/.nvm/versions/node/v20.13.0/lib/node_modules/tenderly-wizard/src/scripts/save-vnet-snapshot.ts
    const scriptsToAdd = {
        "deploy:vnet": `hardhat run ${appPath}/src/scripts/deploy-vnet-safes.ts --network virtual_mainnet`,
        "deploy:whitelist": `hardhat run ${appPath}/src/scripts/whitelist-vnet-safes.ts --network virtual_mainnet`,
        "save:vnet-snapshot": `hardhat run ${appPath}/src/scripts/save-vnet-snapshot.mjs --network virtual_mainnet`
    };
    const packageJsonPath = path_1.default.join(process.cwd(), 'package.json');
    if (fs_1.default.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }
        Object.assign(packageJson.scripts, scriptsToAdd);
        fs_1.default.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Scripts added to package.json successfully.');
    }
    else {
        console.error('package.json not found in the current working directory.');
    }
}
exports.updatePackageJson = updatePackageJson;
