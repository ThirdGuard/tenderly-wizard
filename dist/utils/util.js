"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUniformBlockNumber = exports.predictSafeAddress = exports.predictRolesModAddress = exports.updatePackageJson = exports.checkRequiredEnvVariables = exports.findWhitelistClasses = exports.findPermissionsFiles = exports.setGas = exports.setERC20TokenBalance = exports.setERC20TokenBalances = exports.encodeBytes32String = exports.numberToBytes32 = exports.getABICodedAddress = exports.scopeAllowFunctions = exports.scopeTargetsV2 = exports.scopeTargetsV1 = exports.getPreValidatedSignatures = exports.createMultisendTx = exports.ExecutionOptions = exports.OperationType = exports.SALT = void 0;
const ethers_1 = require("ethers");
const ethers_multisend_1 = require("ethers-multisend");
const utils_1 = require("ethers/lib/utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const ts_morph_1 = require("ts-morph");
const child_process_1 = require("child_process");
const env_config_1 = __importDefault(require("../env-config"));
const zodiac_1 = require("@gnosis-guild/zodiac");
exports.SALT = "0x0000000000000000000000000000000000000000000000000000000000000000";
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
/**
 * Encodes multiple transactions so we can then use a Safe with multisend for atomic transacting
 * @param {PopulatedTransaction[]} populatedTxs - Array of populated transactions
 * @param {string} multisendAddr - Address of the multisend contract
 * @returns {MetaTransaction} Encoded multi-transaction
 */
function createMultisendTx(populatedTxs, multisendAddr) {
    const safeTransactionData = populatedTxs.map((popTx) => ({
        to: popTx.to,
        value: popTx.value ? popTx.value.toString() : "0",
        data: popTx.data,
    }));
    return (0, ethers_multisend_1.encodeMulti)(safeTransactionData, multisendAddr);
}
exports.createMultisendTx = createMultisendTx;
/**
 * Generates pre-validated signatures for a single owner on a safe
 * @param {string} from - Address of the signer
 * @param {string} [initialString="0x"] - Initial string to prepend
 * @returns {string} Pre-validated signature string
 */
const getPreValidatedSignatures = (from, initialString = "0x") => {
    return `${initialString}000000000000000000000000${from.replace("0x", "")}000000000000000000000000000000000000000000000000000000000000000001`;
};
exports.getPreValidatedSignatures = getPreValidatedSignatures;
/**
 * Helper function to scope targets in roles contract v1
 * @param {string[]} targetAddrs - Array of target addresses
 * @param {number} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
async function scopeTargetsV1(targetAddrs, roleId, roles) {
    const scopeTargetTxs = await Promise.all(targetAddrs.map(async (target) => {
        //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
        const tx = await roles.populateTransaction.scopeTarget(roleId, target);
        return tx;
    }));
    return scopeTargetTxs;
}
exports.scopeTargetsV1 = scopeTargetsV1;
/**
 * Helper function to scope targets in roles contract v2
 * @param {string[]} targetAddrs - Array of target addresses
 * @param {`0x${string}`} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
async function scopeTargetsV2(targetAddrs, roleId, roles) {
    const scopeTargetTxs = await Promise.all(targetAddrs.map(async (target) => {
        const tx = await roles.populateTransaction.scopeTarget(roleId, target);
        return tx;
    }));
    return scopeTargetTxs;
}
exports.scopeTargetsV2 = scopeTargetsV2;
/**
 * Helper to allow function calls without param scoping
 * @param {string} target - Target contract address
 * @param {string[]} sigs - Array of function signatures
 * @param {number} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
async function scopeAllowFunctions(target, sigs, roleId, roles) {
    const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
        const tx = await roles.populateTransaction.allowFunction(roleId, target, sig, ExecutionOptions.Both);
        return tx;
    }));
    return scopeFuncsTxs;
}
exports.scopeAllowFunctions = scopeAllowFunctions;
/**
 * Encodes an address as ABI
 * @param {string} address - Address to encode
 * @returns {string} ABI encoded address
 */
const getABICodedAddress = (address) => ethers_1.utils.defaultAbiCoder.encode(["address"], [address]);
exports.getABICodedAddress = getABICodedAddress;
/**
 * Converts a number to bytes32 format
 * @param {number} num - Number to convert
 * @returns {`0x${string}`} Bytes32 representation of the number
 */
function numberToBytes32(num) {
    let hexString = ethers_1.utils.hexlify(num);
    hexString = hexString.slice(2);
    const paddedHexString = hexString.padStart(64, "0");
    return `0x${paddedHexString}`;
}
exports.numberToBytes32 = numberToBytes32;
/**
 * Encodes a string to bytes32 format
 * @param {string} text - String to encode
 * @returns {`0x${string}`} Bytes32 representation of the string
 */
exports.encodeBytes32String = utils_1.formatBytes32String;
/**
 * Sets ERC20 token balances for multiple tokens and a single recipient
 * @param {string[]} tokenAddresses - Array of token addresses
 * @param {string} recipient - Address of the recipient
 * @param {BigNumberish} amount - Amount to set for each token
 * @returns {Promise<void>}
 */
const setERC20TokenBalances = async (tokenAddresses, recipient, amount) => tokenAddresses.forEach(async (tokenAddress) => await (0, exports.setERC20TokenBalance)(tokenAddress, recipient, amount));
exports.setERC20TokenBalances = setERC20TokenBalances;
/**
 * Sets ERC20 token balance for a single token and recipient
 * @param {string} token - Token address
 * @param {string} address - Recipient address
 * @param {BigNumberish} amount - Amount to set
 * @returns {Promise<void>}
 */
const setERC20TokenBalance = async (token, address, amount) => {
    const value = ethers_1.BigNumber.from(amount).toHexString();
    await hardhat_1.network.provider.request({
        method: "tenderly_setErc20Balance",
        params: [token, address, value.replace("0x0", "0x")],
    });
};
exports.setERC20TokenBalance = setERC20TokenBalance;
/**
 * Sets gas balance for multiple addresses
 * @returns {Promise<void>}
 */
async function setGas() {
    const { VIRTUAL_MAINNET_RPC } = env_config_1.default;
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
/**
 * Finds all 'permissions.ts' files in a directory and its subdirectories
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
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
/**
 * Finds all classes that extend Whitelist in a directory
 * @param {string} whitelistDir - Directory to search
 * @returns {{ path: string, className: string }[]} Array of objects containing path and class name
 */
function findWhitelistClasses(whitelistDir) {
    const project = new ts_morph_1.Project();
    fs_1.default.readdirSync(whitelistDir, { recursive: true }).forEach(file => {
        if (typeof file === 'string' && file.endsWith('.ts')) {
            project.addSourceFileAtPath(path_1.default.join(whitelistDir, file));
        }
    });
    const whitelistExtensions = [];
    project.getSourceFiles().forEach(sourceFile => {
        const classes = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ClassDeclaration);
        classes.forEach((classDeclaration) => {
            const heritage = classDeclaration.getHeritageClauses();
            if (heritage.some(clause => clause.getTypeNodes().some(node => node.getText().includes('Whitelist')))) {
                const absolutePath = sourceFile.getFilePath();
                whitelistExtensions.push({ path: absolutePath, className: classDeclaration.getName() ?? '' });
            }
        });
    });
    // Filter out AccessControllerWhitelist classes
    const filteredExtensions = whitelistExtensions.filter(extension => !extension.className.includes('AccessControllerWhitelist'));
    whitelistExtensions.length = 0;
    whitelistExtensions.push(...filteredExtensions);
    console.log('Classes extending Whitelist:', whitelistExtensions);
    return whitelistExtensions;
}
exports.findWhitelistClasses = findWhitelistClasses;
/**
 * Checks if required environment variables are present
 * @param {string[]} requiredVariables - Array of required variable names
 * @returns {boolean} True if all required variables are present, false otherwise
 */
function checkRequiredEnvVariables(requiredVariables) {
    const missingVariables = requiredVariables.filter((variable) => !(variable in env_config_1.default));
    console.log({ missingVariables });
    if (missingVariables.length > 0) {
        console.log(`Missing required environment variables: ${missingVariables.join(", ")}`);
        return false;
    }
    console.log("All required environment variables are present.");
    return true;
}
exports.checkRequiredEnvVariables = checkRequiredEnvVariables;
/**
 * Updates package.json with new scripts
 * @returns {void}
 */
function updatePackageJson() {
    const tenderlyWizardPath = (0, child_process_1.execSync)('which tenderly-wizard').toString().trim();
    console.log("tenderlyWizardPath: ", tenderlyWizardPath);
    const appPath = (0, child_process_1.execSync)(`readlink -f ${tenderlyWizardPath}`).toString().trim().replace(/(.*tenderly-wizard).*/, '$1');
    console.log("appPath: ", appPath);
    const scriptsToAdd = {
        "deploy:safes": `hardhat run ${appPath}/dist/scripts/deploy-vnet-safes.js --network virtual_mainnet`,
        "deploy:whitelist": `hardhat run ${appPath}/dist/scripts/whitelist-vnet-safes.js --network virtual_mainnet`,
        "save:vnet-snapshot": `hardhat run ${appPath}/dist/scripts/save-vnet-snapshot.js --network virtual_mainnet`
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
        return scriptsToAdd;
    }
    else {
        console.error('package.json not found in the current working directory.');
    }
}
exports.updatePackageJson = updatePackageJson;
async function predictRolesModAddress(signer, owner, avatar, target, rolesVersion) {
    const encodedInitParams = utils_1.defaultAbiCoder.encode(["address", "address", "address"], [owner, avatar, target]);
    const rolesContract = rolesVersion == "v1" ? zodiac_1.KnownContracts.ROLES_V1 : zodiac_1.KnownContracts.ROLES_V2;
    const moduleSetupData = zodiac_1.ContractFactories[rolesContract]
        .createInterface()
        .encodeFunctionData("setUp", [encodedInitParams]);
    return (0, zodiac_1.calculateProxyAddress)(zodiac_1.ContractFactories[zodiac_1.KnownContracts.FACTORY].connect(zodiac_1.ContractAddresses[1][zodiac_1.KnownContracts.FACTORY], signer), zodiac_1.ContractAddresses[1][rolesContract], moduleSetupData, exports.SALT);
}
exports.predictRolesModAddress = predictRolesModAddress;
/**
 * Predicts the address of a Safe proxy that will be deployed through a Safe proxy factory
 * @param {Contract} safeProxyFactory - Instance of the Safe proxy factory contract
 * @param {string} safeMasterCopy - Address of the Safe master copy implementation
 * @param {string} data - Initialization data for the Safe proxy
 * @param {number} saltNonce - Nonce used as salt for address calculation
 * @returns {Promise<string>} The predicted address of the Safe proxy
 * @description Uses the proxy factory's calculateCreateProxyWithNonceAddress method to predict
 * the deterministic address where a Safe proxy will be deployed based on the initialization parameters
 */
async function predictSafeAddress(safeProxyFactory, safeMasterCopy, data, saltNonce) {
    return await safeProxyFactory.calculateCreateProxyWithNonceAddress(safeMasterCopy, data, saltNonce, {
        gasLimit: ethers_1.BigNumber.from("3000000")
    });
}
exports.predictSafeAddress = predictSafeAddress;
/**
 * Sets the current block number to a target block number by increasing blocks
 * @param {number} targetBlock - The desired block number to reach
 * @returns {Promise<void>} A promise that resolves when blocks have been increased
 * @description This function is useful for testing scenarios that require being at a specific block number.
 * It calculates the difference between current and target block numbers and increases blocks accordingly.
 */
async function setUniformBlockNumber(targetBlock) {
    const currentBlock = await hardhat_1.network.provider.send("eth_blockNumber");
    const currentBlockDecimal = parseInt(currentBlock, 16);
    const blocksToIncrease = targetBlock - currentBlockDecimal;
    console.log("targetBlock:", targetBlock);
    console.log("currentBlock:", currentBlockDecimal);
    console.log("blocksToIncrease:", blocksToIncrease);
    await hardhat_1.network.provider.request({
        method: "evm_increaseBlocks",
        params: [hardhat_1.ethers.utils.hexValue(blocksToIncrease)]
    });
}
exports.setUniformBlockNumber = setUniformBlockNumber;
