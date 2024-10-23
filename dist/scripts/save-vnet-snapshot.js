"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const virtual_test_net_1 = __importDefault(require("./virtual-test-net"));
async function getVnetSnapshot() {
    console.log("Getting snapshot");
    const snapshot = await hardhat_1.network.provider.send("evm_snapshot", []);
    return snapshot;
}
(async () => {
    const snapshot = await getVnetSnapshot();
    console.log("Snapshot: ", snapshot);
    virtual_test_net_1.default.addToEnvFile('TENDERLY_SNAPSHOT', snapshot);
})();
