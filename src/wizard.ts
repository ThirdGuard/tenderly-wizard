import { Terminal, terminal } from "terminal-kit";
import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";
import VirtualTestNet from "./scripts/virtual-test-net";
import colors from "colors";
import { SingleColumnMenuResponse } from "terminal-kit/Terminal";
import { stripAnsi, updatePackageJson } from "./utils/file-manipulation";
import { findWhitelistClasses } from "./utils/util";
import path from "path";

const rolesVersions = ["V1", "V2"];

async function getTestnetList() {
  terminal.reset("========================\n");
  terminal.black(" 🧙 TENDERLY WIZARD 🧙\n");
  terminal.black("========================\n");
  const vnets = await VirtualTestNet.listVirtualTestnets(); // Get the list of virtual testnets
  const testnets = vnets.map(vnet => " 🌐 " + vnet.displayName);
  testnets.unshift("\n");
  testnets.unshift(colors.blue("Select an existing Testnet:"));
  testnets.unshift("\n");
  testnets.unshift("========================");
  testnets.unshift(colors.green("➕ CREATE TESTNET"));
  testnets.unshift(colors.green("➕ CREATE TESTNET & SETUP"));
  testnets.push("\n");
  testnets.push("========================");
  testnets.push(colors.red("🛑 EXIT"));
  testnets.push("========================");
  // terminal.reset("========================");

  let testnet: SingleColumnMenuResponse =
    await terminal.singleColumnMenu(testnets).promise;
  console.log(
    (testnet.selectedText = testnet.selectedText.replace(" 🌐 ", ""))
  );

  if (
    testnet.selectedText == colors.red("🛑 EXIT") ||
    testnet.selectedText == "\n" ||
    testnet.selectedText == "========================" ||
    testnet.selectedText == colors.blue("Select Testnet:")
  ) {
    terminal.processExit(0);
  }

  if (testnet.selectedText == colors.green("➕ CREATE TESTNET")) {
    const result = await createNewTestnet(terminal);
    testnet.selectedText = result.testnetName;
    terminal.processExit(0);
  }

  if (testnet.selectedText == colors.green("➕ CREATE TESTNET & SETUP")) {
    // create new testnet
    const result = await createNewTestnet(terminal);
    testnet.selectedText = result.testnetName;

    // deploy safes
    const outputSafes = execSync(`npm run deploy:safes`, {
      stdio: "pipe",
    }).toString();
    console.log(outputSafes);

    // apply whitelist
    const outputWhitelist = execSync(`npm run deploy:whitelist`, {
      stdio: "pipe",
    }).toString();
    console.log(outputWhitelist);

    // save snapshot
    const outputSnapshot = execSync(`npm run save:vnet-snapshot`, {
      stdio: "pipe",
    }).toString();
    console.log(outputSnapshot);

    terminal.processExit(0);
  }
  return testnet;
}

export async function start() {
  // update target repo's package.json with scripts
  let scripts;
  if (!process.env.IS_DEV) {
    updatePackageJson();
  }

  terminal.grabInput(true);
  terminal.on("key", (name: any, matches: any, data: any) => {
    if (name === "ESCAPE") {
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

  const action = await terminal.singleColumnMenu([
    "Fork",
    colors.red("Delete"),
    "Snapshot",
    "Activate",
    "Deploy Safes",
    "Apply Whitelist",
    colors.blue("Back"),
  ]).promise;

  // fork testnet
  if (action.selectedIndex == 0) {
    terminal.reset("Enter the name of the fork name: ");
    const newTestnet = await terminal.inputField().promise;
    console.log(`fork testnet: ${newTestnet}`);
    const result = await VirtualTestNet.forkVirtualTestNet(
      vnet?.vnet_id as string,
      newTestnet as string
    );
    console.log(`Forked testnet: ${result.vnet_id}`);
  }

  // delete testnet
  if (action.selectedIndex == 1) {
    console.log(
      "Are you sure you want to delete this testnet (Y/N):",
      testnet.selectedText
    );
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
    const output = execSync(`npm run save:vnet-snapshot`, {
      stdio: "pipe",
    }).toString();
    console.log(output);
  }

  // activate testnet
  if (action.selectedIndex == 3) {
    // get vnet details
    const testNet = await VirtualTestNet.getTestnet(testnet.selectedText);

    // // overwrite RPC, Testnet UUID and Fork ID in .env
    VirtualTestNet.addToEnvFile(
      "VIRTUAL_MAINNET_RPC",
      testNet?.admin_rpc ?? ""
    );
    VirtualTestNet.addToEnvFile(
      "TENDERLY_TESTNET_UUID",
      testNet?.vnet_id ?? ""
    );
    VirtualTestNet.addToEnvFile(
      "TENDERLY_FORK_ID",
      testNet?.network_id?.toString() ?? "1"
    );

    // overwrite Snapshot in .env
    const output = execSync(`npm run save:vnet-snapshot`, {
      stdio: "pipe",
    }).toString();
    console.log(output);

    console.log(`Testnet ${testnet.selectedText} activated successfully`);
  }

  // deploy safes
  if (action.selectedIndex == 4) {
    // select roles version
    await selectRolesVersion(terminal);

    // confirmation
    console.log(
      "Are you sure you want to deploy default safes to this testnet (Y/N):",
      testnet.selectedText
    );
    const confirmDeploy = await terminal.yesOrNo().promise;
    if (confirmDeploy?.valueOf()) {
      console.log("\nDeploying default safes...");
      const output = execSync(`npm run deploy:safes`, {
        stdio: "pipe",
      }).toString();
      console.log(output);
      console.log("\nDeployed default safes successfully");
    }
  }

  // deploy whitelist
  if (action.selectedIndex == 5) {
    // select roles version
    await selectRolesVersion(terminal);

    let output: any;

    // if roles version is v2, skip menu for selecting whitelisting options
    if (process.env.ROLES_VERSION === "v2") {
      console.log(`\nWhitelisting all ${process.env.ROLES_VERSION}...`);
      output = executeWithLogs(
        `npm run deploy:whitelist && npm run save:vnet-snapshot`
      );
    } else {
      // show menu to select whitelisting options
      const whitelistOptions = ["Whitelist all", "Whitelist one"];
      const whitelistSelection =
        await terminal.singleColumnMenu(whitelistOptions).promise;

      // whitelist all
      if (whitelistSelection.selectedIndex == 0) {
        console.log(`\nWhitelisting all ${process.env.ROLES_VERSION}...`);
        output = executeWithLogs(
          `BYPASS_APPROVALS=true npm run deploy:whitelist && npm run save:vnet-snapshot`
        );
      } else if (whitelistSelection.selectedIndex == 1) {
        // whitelist one
        console.log(`\nWhitelisting one ${process.env.ROLES_VERSION}...`);
        // @todo get a list of all whitelists
        const whiteLists = await getWhitelistsV1();
        // Extract class names and format them into readable sentences
        const whitelistNames = whiteLists.map(wl => {
          // Split by capital letters and join with spaces
          const formatted = wl.className.replace(/([A-Z])/g, " $1").trim();
          // Capitalize first letter of each word
          return formatted
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        });

        // Create menu from formatted names
        const whitelistSelection =
          await terminal.singleColumnMenu(whitelistNames).promise;

        // Join the selected text back into a single word (removing spaces)
        const selectedClassName = whitelistSelection.selectedText
          .split(" ")
          .join("");

        // Find the corresponding whitelist entry
        const selectedWhitelist = whiteLists.find(
          wl => wl.className === selectedClassName
        );

        if (!selectedWhitelist) {
          console.error("Could not find matching whitelist for selection");
          return;
        } else {
          // feed the selected whitelist to the execute whitelist v1 function
          process.env.SELECTED_WHITELIST = JSON.stringify(selectedWhitelist);
          output = executeWithLogs(
            `BYPASS_APPROVALS=true npm run execute:whitelist && npm run save:vnet-snapshot`
          );
        }
      }
    }

    if (output) {
      if (!output?.success) {
        console.error("Error details:", output?.error);
        console.error("Error output:", output?.output);
      } else {
        console.log(output);
        console.log("\nApplied whitelist successfully");
      }
    }

    // // confirmation
    // console.log(
    //   "Are you sure you want to apply whitelist to the default safes on this testnet (Y/N):",
    //   testnet.selectedText
    // );
    // const confirmDeploy = await terminal.yesOrNo().promise;
    // if (confirmDeploy?.valueOf()) {
    //   console.log("\nApplying whitelist...");

    //   const output = executeWithLogs(
    //     `npm run deploy:whitelist && npm run save:vnet-snapshot`
    //   );
    //   console.log(output);
    //   if (!output.success) {
    //     console.error("Error details:", output.error);
    //     console.error("Error output:", output.output);
    //   } else {
    //     console.log("\nApplied whitelist successfully");
    //   }
    // }
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
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      ...options,
    };

    // Execute the command and capture output
    const output = execSync(command, defaultOptions);
    return {
      success: true,
      output: stripAnsi(output.toString()),
      error: null,
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
        command: error.cmd,
      },
    };
  }
}

async function createNewTestnet(terminal: Terminal) {
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
  } else if (chainSelection.selectedIndex == 2) {
    chain = 137;
  }

  // select roles version
  await selectRolesVersion(terminal);

  console.log(`create testnet: ${newTestnet}`);
  const result = await VirtualTestNet.createVirtualTestNet(
    newTestnet as string,
    chain
  );

  // set env variables
  await VirtualTestNet.addToEnvFile("TENDERLY_FORK_ID", chain.toString());

  // get snapshot
  const outputSnapshot = execSync(`npm run save:vnet-snapshot`, {
    stdio: "pipe",
  }).toString();
  console.log(outputSnapshot);

  return {
    testnetName: newTestnet as string,
    result,
  };
}

async function selectRolesVersion(terminal: Terminal): Promise<string> {
  terminal.red("Select roles version: ");
  const roleVersionSelection =
    await terminal.singleColumnMenu(rolesVersions).promise;

  // Default to v1
  let rolesVersion = "v1";
  if (roleVersionSelection.selectedIndex == 1) {
    rolesVersion = "v2";
  }

  // Update .env file
  await VirtualTestNet.addToEnvFile("ROLES_VERSION", rolesVersion);
  return rolesVersion;
}

async function getWhitelistsV1() {
  const whitelistDirectory = "../access-control-safes/src/whitelist";

  const callerDir = process.cwd();
  const absoluteWhitelistDirectory = path.resolve(
    callerDir,
    whitelistDirectory
  );
  console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory);

  let whitelists: { path: string; className: string }[] = [];
  try {
    whitelists = findWhitelistClasses(whitelistDirectory);
  } catch (error) {
    console.error("Error finding permissions files:", error);
    process.exit(1);
  }

  return whitelists;
}
