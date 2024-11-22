import fs from "fs";
import path from "path";
import config from "../env-config";

export class VirtualTestNet {
  async deleteVirtualTestNet(testnetId: string): Promise<void> {
    const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } =
      config;

    if (!TENDERLY_ACCESS_TOKEN || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT_ID) {
      throw new Error("Missing required Tenderly environment variables");
    }

    // const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/testnet/container/${testnetId}`;
    const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT_ID}/vnets/${testnetId}`;

    const headers = {
      Accept: "application/json",
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

  async createVirtualTestNet(
    testnetName: string,
    network_id: number = 1
  ): Promise<{ admin_rpc: string; vnet_id: string } | void> {
    //get envs
    const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } =
      config;
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
      console.log("virtual testnet created");
      const adminRpc: { name: string; url: string } = result.rpcs.find(
        (rpc: { name: string; url: string }) => rpc.name === "Admin RPC"
      );
      this.addToEnvFile("VIRTUAL_MAINNET_RPC", adminRpc.url);
      this.addToEnvFile("TENDERLY_TESTNET_UUID", result.id);
      return { admin_rpc: adminRpc.url, vnet_id: result.id };
    } catch (error) {
      console.error("Error creating Virtual TestNet:", error);
    }
  }

  async forkVirtualTestNet(
    sourceTestnetId: string,
    newTestnetName: string
  ): Promise<{ admin_rpc: string; vnet_id: string }> {
    const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } =
      config;

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

      const result: any = await response.json();
      console.log(
        `Virtual TestNet forked successfully. New TestNet ID: ${result.id}`
      );
      // Update .env file with new testnet information
      const admin_rpc = result.connectivityConfig.endpoints.find(
        (e: any) => e.transportProtocol == "HTTP"
      ).uri;
      await this.addToEnvFile("VIRTUAL_MAINNET_RPC", admin_rpc);
      await this.addToEnvFile("TENDERLY_TESTNET_UUID", result.id);

      return {
        admin_rpc,
        vnet_id: result.id,
      };
    } catch (error) {
      console.error("Error forking Virtual TestNet:", error);
      throw error;
    }
  }

  async listVirtualTestnets(): Promise<
    {
      admin_rpc: string;
      vnet_id: string;
      displayName: string;
      network_id: number;
    }[]
  > {
    const { TENDERLY_ACCESS_TOKEN, TENDERLY_ACCOUNT, TENDERLY_PROJECT_ID } =
      config;

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

      const result: any = await response.json();
      return (
        result?.containers?.map((container: any) => {
          return {
            vnet_id: container.id,
            displayName: container.displayName,
            admin_rpc: container.connectivityConfig.endpoints.find(
              (e: any) => e.transportProtocol == "HTTP"
            ).uri,
            project: container.metadata.project_name,
            account: container.metadata.project_owner_name,
            fork_of: container.metadata.origin_container_display_name || null,
            network_id: container.networkConfig.networkId,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error Getting Virtual TestNets:", error);
      throw error;
    }
  }

  async getTestnet(name: string) {
    const vnets = (await this.listVirtualTestnets()) || [];
    return vnets.find(vnet => vnet?.displayName == name);
  }

  async addToEnvFile(key: string, value: string): Promise<void> {
    // write to .env file
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

    // change .env in current session
    process.env[key] = value;

    console.log(
      `Environment variable ${key} has been added/updated in .env file.`
    );
  }

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
