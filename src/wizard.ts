import { Terminal, terminal } from "terminal-kit";
import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";
import VirtualTestNet from "./scripts/virtual-test-net";
import colors from "colors";
import { SingleColumnMenuResponse } from "terminal-kit/Terminal";
import { stripAnsi, updatePackageJson } from "./utils/file-manipulation";
import { findWhitelistClasses } from "./utils/util";
import path from "path";

async function getTestnetList() {
  terminal.reset("========================\n");
  terminal.black(" 🧙 TENDERLY WIZARD 🧙\n");
  terminal.yellow("  Roles v1 / Ethers v5\n");
  terminal.black("========================\n");

  let vnets;
  try {
    vnets = await VirtualTestNet.listVirtualTestnets(); // Get the list of virtual testnets
  } catch (error: any) {
    terminal.red(`\n✗ Error fetching testnets: ${error.message}\n`);
    terminal("Press any key to exit...\n");
    await terminal.inputField().promise;
    terminal.processExit(1);
    return { selectedText: "" } as SingleColumnMenuResponse;
  }

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
  // Clean up the selected text (remove emoji prefix)
  testnet.selectedText = testnet.selectedText.replace(" 🌐 ", "");

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
    terminal(outputSafes + "\n");

    // apply whitelist
    const outputWhitelist = execSync(`npm run deploy:whitelist`, {
      stdio: "pipe",
    }).toString();
    terminal(outputWhitelist + "\n");

    // save snapshot
    const outputSnapshot = execSync(`npm run save:vnet-snapshot`, {
      stdio: "pipe",
    }).toString();
    terminal(outputSnapshot + "\n");

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
  terminal(`VIRTUAL_MAINNET_RPC=${vnet?.admin_rpc}\n`);
  terminal(`TENDERLY_TESTNET_UUID=${vnet?.vnet_id}\n`);
  terminal.green(`\nSelect Action for ${testnet.selectedText}:\n`);

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
    terminal(`\nForking testnet: ${newTestnet}\n`);
    try {
      const result = await VirtualTestNet.forkVirtualTestNet(
        vnet?.vnet_id as string,
        newTestnet as string
      );
      terminal.green(`✓ Forked testnet successfully: ${result.vnet_id}\n`);
    } catch (error: any) {
      terminal.red(`✗ Error forking testnet: ${error.message}\n`);
    }
  }

  // delete testnet
  if (action.selectedIndex == 1) {
    terminal(
      "\nAre you sure you want to delete this testnet (Y/N): " + testnet.selectedText + "\n"
    );
    const confirmDelete = await terminal.yesOrNo().promise;
    if (confirmDelete?.valueOf()) {
      try {
        await VirtualTestNet.deleteVirtualTestNet(vnet?.vnet_id as string);
        terminal.green("✓ Deleted testnet successfully\n");
      } catch (error: any) {
        terminal.red(`✗ Error deleting testnet: ${error.message}\n`);
      }
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
    terminal(output + "\n");
  }

  // activate testnet
  if (action.selectedIndex == 3) {
    try {
      // get vnet details
      const testNet = await VirtualTestNet.getTestnet(testnet.selectedText);

      if (!testNet) {
        terminal.red(`✗ Could not find testnet: ${testnet.selectedText}\n`);
        return;
      }

      // overwrite RPC, Testnet UUID and Fork ID in .env
      await VirtualTestNet.addToEnvFile(
        "VIRTUAL_MAINNET_RPC",
        testNet.admin_rpc ?? ""
      );
      await VirtualTestNet.addToEnvFile(
        "TENDERLY_TESTNET_UUID",
        testNet.vnet_id ?? ""
      );
      await VirtualTestNet.addToEnvFile(
        "TENDERLY_FORK_ID",
        testNet.network_id?.toString() ?? "1"
      );

      // overwrite Snapshot in .env
      const output = execSync(`npm run save:vnet-snapshot`, {
        stdio: "pipe",
      }).toString();
      terminal(output + "\n");

      terminal.green(`✓ Testnet ${testnet.selectedText} activated successfully\n`);
    } catch (error: any) {
      terminal.red(`✗ Error activating testnet: ${error.message}\n`);
    }
  }

  // deploy safes
  if (action.selectedIndex == 4) {
    // select roles version
    await selectRolesVersion(terminal);

    // confirmation
    terminal(
      "\nAre you sure you want to deploy default safes to this testnet (Y/N): " + testnet.selectedText + "\n"
    );
    const confirmDeploy = await terminal.yesOrNo().promise;
    if (confirmDeploy?.valueOf()) {
      terminal("\nDeploying default safes...\n");
      const output = execSync(`npm run deploy:safes`, {
        stdio: "pipe",
      }).toString();
      terminal(output + "\n");
      terminal.green("\nDeployed default safes successfully\n");
    }
  }

  // deploy whitelist
  if (action.selectedIndex == 5) {
    // select roles version
    await selectRolesVersion(terminal);

    let output: any;

    // show menu to select whitelisting options
    terminal("\n");  // Add space after env file update message
    terminal.cyan("Select whitelisting option:\n");
    const whitelistOptions = ["Whitelist all", "Whitelist one"];
    const whitelistSelection =
      await terminal.singleColumnMenu(whitelistOptions).promise;

    // whitelist all
    if (whitelistSelection.selectedIndex == 0) {
      terminal(`\nWhitelisting all ${process.env.ROLES_VERSION}...\n`);
      output = executeWithLogs(
        `BYPASS_APPROVALS=true npm run deploy:whitelist && npm run save:vnet-snapshot`
      );
    } else if (whitelistSelection.selectedIndex == 1) {
      // whitelist one
      terminal(`\nWhitelisting one ${process.env.ROLES_VERSION}...\n`);
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
        terminal.red("Could not find matching whitelist for selection\n");
        return;
      } else {
        // feed the selected whitelist to the execute whitelist v1 function
        process.env.SELECTED_WHITELIST = JSON.stringify(selectedWhitelist);
        output = executeWithLogs(
          `BYPASS_APPROVALS=true npm run execute:whitelist && npm run save:vnet-snapshot`
        );
      }
    }

    if (output) {
      if (!output?.success) {
        terminal.red("Error details: " + JSON.stringify(output?.error) + "\n");
        terminal.red("Error output: " + output?.output + "\n");
      } else {
        terminal(output + "\n");
        terminal.green("\nApplied whitelist successfully\n");
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

  terminal(`\nCreating testnet: ${newTestnet}\n`);

  try {
    const result = await VirtualTestNet.createVirtualTestNet(
      newTestnet as string,
      chain
    );

    terminal.green(`✓ Testnet created successfully\n`);

    // set env variables
    await VirtualTestNet.addToEnvFile("TENDERLY_FORK_ID", chain.toString(), true);

    // get snapshot
    const outputSnapshot = execSync(`npm run save:vnet-snapshot`, {
      stdio: "pipe",
    }).toString();
    terminal(outputSnapshot + "\n");

    return {
      testnetName: newTestnet as string,
      result,
    };
  } catch (error: any) {
    terminal.red(`✗ Error creating testnet: ${error.message}\n`);
    terminal("Press any key to continue...\n");
    await terminal.inputField().promise;
    throw error;
  }
}

async function selectRolesVersion(terminal: Terminal): Promise<string> {
  const rolesVersion = "v1";

  // Update .env file silently to avoid console.log output
  await VirtualTestNet.addToEnvFile("ROLES_VERSION", rolesVersion, true);
  return rolesVersion;
}

async function getWhitelistsV1() {
  const whitelistDirectory = "../access-control-safes/src/whitelist";

  const callerDir = process.cwd();
  const absoluteWhitelistDirectory = path.resolve(
    callerDir,
    whitelistDirectory
  );
  // Debug log - commented out to avoid terminal display issues
  // console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory);

  let whitelists: { path: string; className: string }[] = [];
  try {
    whitelists = findWhitelistClasses(whitelistDirectory);
  } catch (error) {
    terminal.red("Error finding permissions files: " + error + "\n");
    process.exit(1);
  }

  return whitelists;
}
