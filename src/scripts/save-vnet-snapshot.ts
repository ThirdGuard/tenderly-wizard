import { network } from "hardhat";
import VirtualTestNet from "./virtual-test-net";

async function getVnetSnapshot() {
  console.log("Getting snapshot")
  const snapshot = await network.provider.send("evm_snapshot", []);
  return snapshot
}

(async () => {
  const snapshot = await getVnetSnapshot()
  console.log("Snapshot: ", snapshot)
  VirtualTestNet.addToEnvFile('TENDERLY_SNAPSHOT', snapshot);
})()

