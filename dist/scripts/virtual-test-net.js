"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualTestNet = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_config_1 = __importDefault(require("../env-config"));
class VirtualTestNet {
    async deleteVirtualTestNet(testnetId) {
        const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } = env_config_1.default;
        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }
        // const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/container/${testnetId}`;
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/vnets/${testnetId}`;
        const headers = {
            Accept: "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN,
        };
        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: headers,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(`Virtual TestNet ${testnetId} deleted successfully.`);
        }
        catch (error) {
            console.error("Error deleting Virtual TestNet:", error);
            throw error;
        }
    }
    async createVirtualTestNet(testnetName, network_id = 1) {
        //get envs
        const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } = env_config_1.default;
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/vnets`;
        const headers_ = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN,
        };
        const data = {
            slug: testnetName,
            display_name: testnetName,
            fork_config: {
                network_id,
            },
            virtual_network_config: {
                chain_config: {
                    chain_id: 31337,
                },
            },
            sync_state_config: {
                enabled: false,
            },
            explorer_page_config: {
                enabled: true,
                verification_visibility: "src",
            },
        };
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers_,
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // this.removeEnvKeys();
            const result = await response.json();
            console.log("virtual testnet created");
            this.addToEnvFile("VIRTUAL_MAINNET_RPC", result.rpcs[0].url);
            this.addToEnvFile("TENDERLY_TESTNET_UUID", result.id);
            return { admin_rpc: result.rpcs[0].url, vnet_id: result.id };
        }
        catch (error) {
            console.error("Error creating Virtual TestNet:", error);
        }
    }
    async forkVirtualTestNet(sourceTestnetId, newTestnetName) {
        const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } = env_config_1.default;
        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/clone`;
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN,
        };
        const body = JSON.stringify({
            srcContainerId: sourceTestnetId,
            dstContainerDisplayName: newTestnetName,
        });
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: body,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log(`Virtual TestNet forked successfully. New TestNet ID: ${result.id}`);
            // Update .env file with new testnet information
            await this.addToEnvFile("VIRTUAL_MAINNET_RPC", result.connectivityConfig.endpoints[0].uri);
            await this.addToEnvFile("TENDERLY_TESTNET_UUID", result.id);
            return {
                admin_rpc: result.connectivityConfig.endpoints[0].uri,
                vnet_id: result.id,
            };
        }
        catch (error) {
            console.error("Error forking Virtual TestNet:", error);
            throw error;
        }
    }
    async listVirtualTestnets() {
        const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } = env_config_1.default;
        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/container?page=1&pageSize=20`;
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN,
        };
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: headers,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return (result?.containers?.map((container) => {
                return {
                    vnet_id: container.id,
                    displayName: container.displayName,
                    admin_rpc: container.connectivityConfig.endpoints[0].uri,
                    project: container.metadata.project_name,
                    account: container.metadata.project_owner_name,
                    fork_of: container.metadata.origin_container_display_name || null,
                    network_id: container.networkConfig.networkId,
                };
            }) || []);
        }
        catch (error) {
            console.error("Error Getting Virtual TestNets:", error);
            throw error;
        }
    }
    async getTestnet(name) {
        const vnets = (await this.listVirtualTestnets()) || [];
        return vnets.find((vnet) => vnet?.displayName == name);
    }
    async addToEnvFile(key, value) {
        // write to .env file
        const envPath = path_1.default.resolve(process.cwd(), ".env");
        let envContent = "";
        if (fs_1.default.existsSync(envPath)) {
            envContent = fs_1.default.readFileSync(envPath, "utf8");
        }
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        }
        else {
            envContent += `\n${key}=${value}`;
        }
        fs_1.default.writeFileSync(envPath, envContent.trim() + "\n");
        // change .env in current session
        process.env[key] = value;
        console.log(`Environment variable ${key} has been added/updated in .env file.`);
    }
}
exports.VirtualTestNet = VirtualTestNet;
exports.default = new VirtualTestNet();
