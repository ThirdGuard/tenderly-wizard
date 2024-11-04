"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictRolesModAddress = exports.updatePackageJson = exports.checkRequiredEnvVariables = exports.findWhitelistClasses = exports.findPermissionsFiles = exports.setGas = exports.setERC20TokenBalance = exports.setERC20TokenBalances = exports.encodeBytes32String = exports.numberToBytes32 = exports.getABICodedAddress = exports.scopeAllowFunctions = exports.scopeTargetsV2 = exports.scopeTargetsV1 = exports.getPreValidatedSignatures = exports.createMultisendTx = exports.ExecutionOptions = exports.OperationType = exports.SALT = void 0;
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
async function predictRolesModAddress(signer, owner, avatar, target) {
    const encodedInitParams = utils_1.defaultAbiCoder.encode(["address", "address", "address"], [owner, avatar, target]);
    const moduleSetupData = zodiac_1.ContractFactories[zodiac_1.KnownContracts.ROLES_V1]
        .createInterface()
        .encodeFunctionData("setUp", [encodedInitParams]);
    return (0, zodiac_1.calculateProxyAddress)(zodiac_1.ContractFactories[zodiac_1.KnownContracts.FACTORY].connect(zodiac_1.ContractAddresses[1][zodiac_1.KnownContracts.FACTORY], signer), zodiac_1.ContractAddresses[1][zodiac_1.KnownContracts.ROLES_V1], moduleSetupData, exports.SALT);
}
exports.predictRolesModAddress = predictRolesModAddress;
const addresses = {
    deployer: "0xdef1dddddddddddddddddddddddddddddddddddd",
    avatar: "0xdef1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    owner: "0xdef1010101010101010101010101010101010101",
    member: "0xdef1123412341234123412341234123412341234",
    other: "0xdef10f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
};
async function setupAvatar(avatar = addresses.avatar) {
    // bytecode for TestAvatar contract: https://github.com/gnosisguild/zodiac-modifier-roles/blob/main/packages/evm/contracts/test/TestAvatar.sol
    const testAvatarDeployedBytecode = "0x608060405260043610610036575f3560e01c8063468721a7146100415780635229073f14610075578063c55cbe89146100a2575f80fd5b3661003d57005b5f80fd5b34801561004c575f80fd5b5061006061005b366004610383565b6100c3565b60405190151581526020015b60405180910390f35b348015610080575f80fd5b5061009461008f36600461042f565b61019a565b60405161006c929190610528565b3480156100ad575f80fd5b506100c16100bc366004610383565b610270565b005b5f8160ff1660010361013157856001600160a01b031684846040516100e9929190610563565b5f60405180830381855af49150503d805f8114610121576040519150601f19603f3d011682016040523d82523d5f602084013e610126565b606091505b505080915050610191565b856001600160a01b031685858560405161014c929190610563565b5f6040518083038185875af1925050503d805f8114610186576040519150601f19603f3d011682016040523d82523d5f602084013e61018b565b606091505b50909150505b95945050505050565b5f60608260ff1660010361020857856001600160a01b0316846040516101c09190610572565b5f60405180830381855af49150503d805f81146101f8576040519150601f19603f3d011682016040523d82523d5f602084013e6101fd565b606091505b505080925050610267565b856001600160a01b031685856040516102219190610572565b5f6040518083038185875af1925050503d805f811461025b576040519150601f19603f3d011682016040523d82523d5f602084013e610260565b606091505b5090925090505b94509492505050565b5f60608260ff166001036102e057866001600160a01b03168585604051610298929190610563565b5f60405180830381855af49150503d805f81146102d0576040519150601f19603f3d011682016040523d82523d5f602084013e6102d5565b606091505b505080925050610341565b866001600160a01b03168686866040516102fb929190610563565b5f6040518083038185875af1925050503d805f8114610335576040519150601f19603f3d011682016040523d82523d5f602084013e61033a565b606091505b5090925090505b8161034e57805160208201fd5b50505050505050565b6001600160a01b038116811461036b575f80fd5b50565b803560ff8116811461037e575f80fd5b919050565b5f805f805f60808688031215610397575f80fd5b85356103a281610357565b945060208601359350604086013567ffffffffffffffff808211156103c5575f80fd5b818801915088601f8301126103d8575f80fd5b8135818111156103e6575f80fd5b8960208285010111156103f7575f80fd5b60208301955080945050505061040f6060870161036e565b90509295509295909350565b634e487b7160e01b5f52604160045260245ffd5b5f805f8060808587031215610442575f80fd5b843561044d81610357565b935060208501359250604085013567ffffffffffffffff80821115610470575f80fd5b818701915087601f830112610483575f80fd5b8135818111156104955761049561041b565b604051601f8201601f19908116603f011681019083821181831017156104bd576104bd61041b565b816040528281528a60208487010111156104d5575f80fd5b826020860160208301375f6020848301015280965050505050506104fb6060860161036e565b905092959194509250565b5f5b83811015610520578181015183820152602001610508565b50505f910152565b8215158152604060208201525f825180604084015261054e816060850160208701610506565b601f01601f1916919091016060019392505050565b818382375f9101908152919050565b5f8251610583818460208701610506565b919091019291505056fea2646970667358221220f7fa93e870069255e4379b0c8b48991326a11d431c7f43bcab2c693743e5a60164736f6c63430008150033";
    await hardhat_1.network.provider.send("tenderly_setCode", [
        avatar,
        testAvatarDeployedBytecode,
    ]);
    console.log(`Successfully initilized avatar at ${avatar}`);
}
