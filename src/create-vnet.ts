import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export class VirtualTestNet {

    async deleteVirtualTestNet(testnetId: string): Promise<void> {
        const {
            TENDERLY_ACCESS_TOKEN,
            TENDERLY_ACCOUNT,
            TENDERLY_PROJECT_ID,
        } = process.env;

        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }

        // const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/container/${testnetId}`;
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/vnets/${testnetId}`

        const headers = {
            "Accept": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN!,
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
        } catch (error) {
            console.error("Error deleting Virtual TestNet:", error);
            throw error;
        }
    }

    async createVirtualTestNet(testnetName: string, network_id: number = 1): Promise<{ admin_rpc: string, vnet_id: string } | void> {
        //get envs
        const {
            TENDERLY_ACCESS_TOKEN,
            TENDERLY_ACCOUNT,
            TENDERLY_PROJECT_ID,
        } = process.env;
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/vnets`;
        const headers_ = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN!,
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
            const result: any = await response.json();
            console.log("virtual testnet created")
            VirtualTestNet.addToEnvFile("VIRTUAL_MAINNET_RPC", result.rpcs[0].url)
            VirtualTestNet.addToEnvFile("TENDERLY_TESTNET_UUID", result.id)
            return { admin_rpc: result.rpcs[0].url, vnet_id: result.id };
        } catch (error) {
            console.error("Error creating Virtual TestNet:", error);
        }
    }

    async forkVirtualTestNet(sourceTestnetId: string, newTestnetName: string): Promise<{ admin_rpc: string, vnet_id: string }> {
        const {
            TENDERLY_ACCESS_TOKEN,
            TENDERLY_ACCOUNT,
            TENDERLY_PROJECT_ID,
        } = process.env;

        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }

        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/clone`;

        const headers = {
            "Accept": "application/json",
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

            const result: any = await response.json();
            console.log(`Virtual TestNet forked successfully. New TestNet ID: ${result.id}`);
            // Update .env file with new testnet information
            await VirtualTestNet.addToEnvFile("VIRTUAL_MAINNET_RPC", result.connectivityConfig.endpoints[0].uri);
            await VirtualTestNet.addToEnvFile("TENDERLY_TESTNET_UUID", result.id);

            return { admin_rpc: result.connectivityConfig.endpoints[0].uri, vnet_id: result.id };
        } catch (error) {
            console.error("Error forking Virtual TestNet:", error);
            throw error;
        }
    }


    async listVirtualTestnets(): Promise<{ admin_rpc: string, vnet_id: string, displayName: string }[]> {
        const {
            TENDERLY_ACCESS_TOKEN,
            TENDERLY_ACCOUNT,
            TENDERLY_PROJECT_ID,
        } = process.env;

        if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
            throw new Error("Missing required Tenderly environment variables");
        }

        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/container?page=1&pageSize=20`;

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Access-Key": TENDERLY_ACCESS_TOKEN,
        };

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: any = await response.json();
            return result?.containers?.map((container: any) => {
                return { vnet_id: container.id, displayName: container.displayName, admin_rpc: container.connectivityConfig.endpoints[0].uri, project: container.metadata.project_name, account: container.metadata.project_owner_name, fork_of: container.metadata.origin_container_display_name || null }
            }) || []
        } catch (error) {
            console.error("Error Getting Virtual TestNets:", error);
            throw error;
        }
    }

    async getTestnet(name: string) {
        const vnets = await this.listVirtualTestnets() || [];
        return vnets.find(vnet => vnet?.displayName == name)
    }

    static async addToEnvFile(key: string, value: string): Promise<void> {
        const envPath = path.resolve(process.cwd(), ".env");

        let envContent = "";
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        }

        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }

        fs.writeFileSync(envPath, envContent.trim() + "\n");
        console.log(
            `Environment variable ${key} has been added/updated in .env file.`,
        );
    }

    // checkTenderlyEnvVariables(): boolean {
    //     const requiredVariables = [
    //         "TENDERLY_PROJECT_ID",
    //         "TENDERLY_ACCOUNT",
    //         "TENDERLY_ACCESS_TOKEN",
    //     ];

    //     const missingVariables = requiredVariables.filter(
    //         (variable) => !process.env[variable],
    //     );

    //     if (missingVariables.length > 0) {
    //         console.error(
    //             "The following required Tenderly environment variables are missing:",
    //         );
    //         missingVariables.forEach((variable) => console.error(`- ${variable}`));
    //         return false;
    //     }

    //     if (process.env.TENDERLY_PROJECT_ID !== "project") {
    //         console.error('TENDERLY_PROJECT_ID should be set to "project"');
    //         return false;
    //     }

    //     if (process.env.TENDERLY_ACCOUNT !== "Abujari") {
    //         console.error('TENDERLY_ACCOUNT should be set to "Abujari"');
    //         return false;
    //     }

    //     if (process.env.TENDERLY_CHAIN_ID !== "31337") {
    //         console.error("TENDERLY_CHAIN_ID should be set to 31337");
    //         return false;
    //     }

    //     console.log(
    //         "All required Tenderly environment variables are present and correct.",
    //     );
    //     return true;
    // }

    // removeEnvKeys() {
    //     const envPath = path.resolve(process.cwd(), ".env");
    //     const envConfig = dotenv.parse(fs.readFileSync(envPath));

    //     const keysToRemove = [
    //         "TENDERLY_SNAPSHOT",
    //         "AC_SAFE",
    //         "INV_SAFE",
    //         "INV_ROLES",
    //         "AC_ROLES",
    //     ];

    //     keysToRemove.forEach((key) => {
    //         delete envConfig[key];
    //     });

    //     const newEnvContent = Object.entries(envConfig)
    //         .map(([key, value]) => `${key}=${value}`)
    //         .join("\n");

    //     fs.writeFileSync(envPath, newEnvContent);
    //     console.log("Specified keys removed from .env file");
    // }
}

export default new VirtualTestNet();
// export function checkRequiredEnvVariables() {
//     const requiredVariables = ["AC_SAFE", "INV_SAFE", "INV_ROLES", "AC_ROLES"];

//     const missingVariables = requiredVariables.filter(
//         (variable) => !process.env[variable],
//     );

//     console.log({ missingVariables });

//     if (missingVariables.length > 0) {
//         console.log(
//             `Missing required environment variables: ${missingVariables.join(", ")}`,
//         );
//         return false;
//     }

//     console.log("All required environment variables are present.");
//     return true;
// }