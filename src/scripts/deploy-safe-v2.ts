import SAFE_MASTER_COPY_ABI from "../contracts/safe_master_copy_v2.json";
import SAFE_PROXY_FACTORY_ABI from "../contracts/safe_proxy_factory_v2.json";
import { createMultisendTx, getPreValidatedSignatures } from "../utils/util";
import colors from "colors";
// @ts-ignore
import { ethers } from "hardhat";
import { GAS_LIMIT, SAFE_OPERATION_DELEGATECALL, tx } from "../utils/constants";
import { ChainConfig } from "../utils/types";
import { ZeroAddress } from "ethers";

export async function deploySafeV2(
  chainConfig: ChainConfig["v2"],
  saltNonce: number
) {
  const [caller] = await ethers.getSigners();
  const safeMaster = new ethers.Contract(
    chainConfig.SAFE_MASTER_COPY_ADDR,
    SAFE_MASTER_COPY_ABI,
    caller
  );

  // In v6, we need to use the function directly for populateTransaction
  const initializer = await safeMaster.setup.populateTransaction(
    [caller.address],
    1, //threshold
    ZeroAddress,
    "0x",
    chainConfig.DEFAULT_FALLBACK_HANDLER_ADDRESS,
    ZeroAddress,
    0,
    ZeroAddress
  );

  const safeProxyFactory = new ethers.Contract(
    chainConfig.SAFE_PROXY_FACTORY_ADDR,
    SAFE_PROXY_FACTORY_ABI,
    caller
  );

  const txResponse = await safeProxyFactory.createProxyWithNonce(
    chainConfig.SAFE_MASTER_COPY_ADDR,
    initializer.data,
    saltNonce,
    {
      gasLimit: GAS_LIMIT,
    }
  );

  const txReceipt = await txResponse.wait();
  // In v6, we need to use logs and check the fragment name
  const txData = txReceipt.logs?.find(
    (x: any) => x.fragment?.name === "ProxyCreation"
  );
  const deployedSafeAddress = txData?.args?.proxy;
  console.info(colors.green(`✅ Safe was deployed to ${deployedSafeAddress}`));
  return deployedSafeAddress;
}

export async function addSafeSigners(
  safeAddr: string,
  newOwners: string[],
  chainConfig: ChainConfig["v2"]
) {
  const [caller] = await ethers.getSigners();
  const safe = new ethers.Contract(safeAddr, SAFE_MASTER_COPY_ABI, caller);
  const currentOwners: string[] = await safe.getOwners();

  const hasCommonOwner = newOwners.some(newOwner =>
    currentOwners.some(
      currentOwner => currentOwner.toLowerCase() === newOwner.toLowerCase()
    )
  );

  if (!hasCommonOwner) {
    const addOwnersTxs = await Promise.all(
      newOwners.map(async owner => {
        // In v6, we use the function directly for populateTransaction
        return await safe.addOwnerWithThreshold.populateTransaction(owner, 1);
      })
    );

    const metaTxs = createMultisendTx(addOwnersTxs, chainConfig.MULTISEND_ADDR);
    const signature = getPreValidatedSignatures(caller.address);

    const addSignersTx = await safe.execTransaction(
      chainConfig.MULTISEND_ADDR,
      tx.zeroValue,
      metaTxs.data,
      SAFE_OPERATION_DELEGATECALL,
      tx.avatarTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signature
    );

    const txReceipt = await addSignersTx.wait();
    // In v6, we need to use logs and check the fragment name
    const txData = txReceipt.logs?.filter(
      (x: any) => x.fragment?.name === "AddedOwner"
    );
    const ownersAddedFromEvent = txData.map((log: any) => log.args);
    console.info(
      `\n🔑 New owners added: ${ownersAddedFromEvent.join(", ")} on Safe: ${safeAddr}`
    );
  } else {
    console.info(
      `No new owners were added to Safe: ${safeAddr} as at least one owner you tried to add is already an owner on this Safe`
    );
  }
}

export async function removeDeployerAsOwner(
  safeAddr: string,
  threshold: number
) {
  const [caller] = await ethers.getSigners();
  const safe = new ethers.Contract(safeAddr, SAFE_MASTER_COPY_ABI, caller);
  const owners: string[] = await safe.getOwners();

  const isDeployerStillOwner = owners.some(
    owner => owner.toLowerCase() === caller.address.toLowerCase()
  );

  if (isDeployerStillOwner) {
    const callerIndex = owners.findIndex(owner => owner === caller.address);
    const prevOwnerIndex = (callerIndex - 1 + owners.length) % owners.length;
    const prevOwner = owners[prevOwnerIndex];

    // In v6, we use the function directly for populateTransaction
    const removeOwnersPopTx = await safe.removeOwner.populateTransaction(
      prevOwner,
      caller.address,
      threshold
    );

    const signature = getPreValidatedSignatures(caller.address);

    const removeTx = await safe.execTransaction(
      safeAddr,
      tx.zeroValue,
      removeOwnersPopTx.data,
      tx.operation,
      tx.avatarTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signature,
      {
        gasLimit: GAS_LIMIT,
      }
    );

    await removeTx.wait();
    console.info(
      `\n🔒 Deployer: ${caller.address} was removed as an owner on Safe: ${safeAddr}`
    );
  } else {
    console.info(
      `Deployer ${caller.address} is not an owner on Safe: ${safeAddr} so we can't remove them as an owner`
    );
  }
}
