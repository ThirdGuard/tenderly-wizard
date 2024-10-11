import { network } from "hardhat";
import { VirtualTestNet } from "./create-vnet";

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

