import SAFE_MASTER_COPY_ABI from "../contracts/safe_master_copy_v1.json";
import SAFE_MODULE_PROXY_FACTORY_ABI from "../contracts/safe_module_proxy_factory_v1.json";
import ROLES_V1_MASTER_COPY_ABI from "../contracts/roles_v1.json";
import { AccessControllerWhitelistV1 } from "../whitelist/acs/scope-access-controller-v1";
import colors from "colors";
import { addSafeSigners, deploySafe, removeDeployerAsOwner } from "./deploy-safe-v1";
import { tx, SAFE_OPERATION_DELEGATECALL, MANAGER_ROLE_ID_V1, SECURITY_ROLE_ID_V1 } from "../utils/constants";
// @ts-ignore
import { ethers } from "hardhat";
import { createMultisendTx, getPreValidatedSignatures, predictRolesModAddress, SALT } from "../utils/util";
import { ChainConfig } from "../utils/types";
import { getChainConfig } from "../utils/roles-chain-config";
import { ChainId } from "zodiac-roles-sdk/.";
import { constants, Contract, utils } from "ethers";
import { ContractAddresses, ContractFactories, KnownContracts, calculateProxyAddress, deployAndSetUpModule } from "@gnosis-guild/zodiac"

//@dev note that hardhat struggles with nested contracts. When we call a Safe to interact with Roles, only events from the Safe can be detected.
export async function deployRoles(
  owner: string,
  avatar: string,
  target: string,
  proxied: boolean,
  chainId: ChainId,
  chainConfig: ChainConfig["v1"]
) {
  const [caller] = await ethers.getSigners();
  if (proxied) {
    // const abiCoder = utils.defaultAbiCoder;
    // const encoded = abiCoder.encode(
    //   ["address", "address", "address"],
    //   [owner, avatar, target]
    // );

    console.log("owner:", owner);
    console.log("avatar:", avatar);
    console.log("target:", target);

    // get expected Module Address and transaction
    const { expectedModuleAddress, transaction } = await deployAndSetUpModule(
      KnownContracts.ROLES_V1,
      {
        types: ["address", "address", "address"],
        values: [owner, avatar, target],
      },
      caller.provider,
      chainId,
      SALT
    )

    const adx = await predictRolesModAddress(caller, owner, avatar, target)
    console.log(`prediected roles address: ${adx}`)

    // check if address is matching predicted address before processing transaction
    if (expectedModuleAddress !== (await predictRolesModAddress(caller, owner, avatar, target))) {
      throw new Error(
        `Roles mod address deployment unexpected, expected ${predictRolesModAddress(caller, owner, avatar, target)}, actual: ${expectedModuleAddress}`
      )
    }

    // const rolesMaster = new Contract(
    //   chainConfig.ROLES_MASTER_COPY_ADDR,
    //   ROLES_V1_MASTER_COPY_ABI,
    //   caller
    // );
    // const initParams = await rolesMaster.populateTransaction.setUp(encoded);
    // const tsSalt = new Date().getTime(); // salt must be the same
    // const safeModuleProxyFactory = new Contract(
    //   chainConfig.SAFE_MODULE_PROXY_FACTORY_ADDR,
    //   SAFE_MODULE_PROXY_FACTORY_ABI,
    //   caller
    // );
    // const deployModTx = await safeModuleProxyFactory.deployModule(
    //   chainConfig.ROLES_MASTER_COPY_ADDR,
    //   initParams.data as string,
    //   tsSalt
    // );
    // const txReceipt = await deployModTx.wait();
    // const txData = txReceipt.events?.find(
    //   (x: any) => x.event == "ModuleProxyCreation"
    // );
    // const rolesModAddress = txData?.args?.proxy;

    try {
      await caller.sendTransaction(transaction)
      console.info(
        colors.green(`✅ Roles was deployed via proxy factory to ${expectedModuleAddress}`)
      );
      return expectedModuleAddress;
    } catch (e: any) {
      console.error(e)
      throw new Error(`Roles mod address deployment failed: ${e}`)
    }
  }

  const Permissions = await ethers.getContractFactory("Permissions");
  const permissions = await Permissions.deploy();
  const Roles = await ethers.getContractFactory("Roles", {
    libraries: {
      Permissions: permissions.address,
    },
  });
  const roles = await Roles.deploy(owner, avatar, target);
  console.info("Modifier deployed to:", roles.address, "\n");
  return roles.address;
}

//If the roles module is not already enabled on Safe, enable it
export async function enableRolesModifier(safeAddr: string, rolesAddr: string) {
  const [caller] = await ethers.getSigners();
  const signature = getPreValidatedSignatures(caller.address);

  const invSafe = new Contract(safeAddr, SAFE_MASTER_COPY_ABI, caller);
  const enabled = await invSafe.isModuleEnabled(rolesAddr);
  console.log(`ℹ️  Roles modifier: ${rolesAddr} is enabled on safe: ${safeAddr} ${enabled}`
  );
  if (!enabled) {
    const enable = await invSafe.populateTransaction.enableModule(rolesAddr);
    const enableTx = await invSafe.execTransaction(
      safeAddr,
      tx.zeroValue,
      enable.data ?? "",
      tx.operation,
      tx.avatarTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signature
    );
    const txReceipt = await enableTx.wait();
    const txData = txReceipt.events?.find(
      (x: any) => x.event == "EnabledModule"
    );
    const moduleEnabledFromEvent = txData?.args?.module;
    console.info(
      colors.blue(
        `ℹ️  Roles modifier: ${moduleEnabledFromEvent} has been enabled on safe: ${safeAddr}`
      )
    );
  } else {
    console.info(
      `Roles modifier: ${rolesAddr} was already enabled on safe: ${safeAddr}`
    );
  }
}

// sets the address of the multisend contract
export async function setRolesMultisend(safeAddr: string, rolesAddr: string, chainConfig: ChainConfig["v1"]) {
  const [caller] = await ethers.getSigners();
  const roles = new Contract(
    rolesAddr,
    ROLES_V1_MASTER_COPY_ABI,
    caller
  );
  const multisendOnRecord = await roles.multisend();
  //If no MS on record, submit a tx to write one on record
  if (multisendOnRecord === constants.AddressZero) {
    const setMsPopTx = await roles.populateTransaction.setMultisend(
      chainConfig.MULTISEND_ADDR
    );
    const safe = new Contract(safeAddr, SAFE_MASTER_COPY_ABI, caller);
    const signature = getPreValidatedSignatures(caller.address);
    await safe.execTransaction(
      rolesAddr,
      tx.zeroValue,
      setMsPopTx.data,
      tx.operation,
      tx.avatarTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signature
    );
    console.info(
      colors.blue(`ℹ️  Multisend has been set to: ${chainConfig.MULTISEND_ADDR}`)
    );
  } else {
    console.info(
      `Multisend has already been previously set to: ${multisendOnRecord}`
    );
  }
}

// assign a role to a array of members addresses attached to a role id policy
export async function assignRoles(
  safeAddr: string,
  rolesAddr: string,
  memberAddrs: string[],
  roleId: number,
  chainConfig: ChainConfig["v1"]
) {
  const [caller] = await ethers.getSigners();
  // assign manager a role (becomes a member of role:manager_role_id)
  const roles = new Contract(
    rolesAddr,
    ROLES_V1_MASTER_COPY_ABI,
    caller
  );
  const signature = getPreValidatedSignatures(caller.address);
  const acSafe = new Contract(safeAddr, SAFE_MASTER_COPY_ABI, caller);

  const assignRolesPopTx = await Promise.all(
    memberAddrs.map(async (memberAddr) => {
      return await roles.populateTransaction.assignRoles(
        memberAddr,
        [roleId],
        [true]
      );
    })
  );
  const metaTxs = createMultisendTx(assignRolesPopTx, chainConfig.MULTISEND_ADDR);
  await acSafe.execTransaction(
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

  console.info(
    colors.blue(
      `Role member: ${memberAddrs.toString()} has been assigned role id: ${roleId}`
    )
  );
}

// this will deploy the entire system from scratch, WITHOUT any investment manager permissions
export const deployAccessControlSystemV1 = async (
  chainId: ChainId,
  options: {
    proxied: boolean;
    sysAdminAddresses: string[];
    acSafeThreshold: number;
    invSafeThreshold: number;
    securityEOAs: string[];
    managerEOAs: string[];
  },
  deployed?: {
    acSafeAddr: string | null;
    invSafeAddr: string | null;
    invRolesAddr: string | null;
    acRolesAddr: string | null;
  }
) => {
  // get chain config for multichain deploy
  const chainConfig = getChainConfig(chainId, "v1");

  //Deploy both safes
  const accessControlSafeAddr = deployed?.acSafeAddr || (await deploySafe(chainConfig));
  const investmentSafeAddr = deployed?.invSafeAddr || (await deploySafe(chainConfig));

  // //Deploy and enable a Roles modifier on the investment safe
  const invRolesAddr =
    deployed?.invRolesAddr ||
    (await deployRoles(
      accessControlSafeAddr,
      investmentSafeAddr,
      investmentSafeAddr,
      options.proxied,
      chainId,
      chainConfig,
    ));

  await enableRolesModifier(investmentSafeAddr, invRolesAddr);
  //Set the multisend address on roles so that manager can send multisend txs later on
  await setRolesMultisend(accessControlSafeAddr, invRolesAddr, chainConfig);

  //Deploy and enable a Roles modifier on the access control safe
  const acRolesAddr =
    deployed?.acRolesAddr ||
    (await deployRoles(
      accessControlSafeAddr,
      accessControlSafeAddr,
      accessControlSafeAddr,
      options.proxied,
      chainId,
      chainConfig
    ));
  await enableRolesModifier(accessControlSafeAddr, acRolesAddr);

  //Set the multisend address on roles so that manager can send multisend txs later on
  await setRolesMultisend(accessControlSafeAddr, acRolesAddr, chainConfig);

  //Grant an access controller role to Security EOA's
  await assignRoles(
    accessControlSafeAddr,
    acRolesAddr,
    options.securityEOAs,
    SECURITY_ROLE_ID_V1,
    chainConfig
  );
  // Populate this role for Security so they can call whitelisting related functions on investment roles
  const [caller] = await ethers.getSigners();
  const accessControllerWhitelist = new AccessControllerWhitelistV1(
    acRolesAddr,
    caller,
  );
  await accessControllerWhitelist.execute(invRolesAddr, accessControlSafeAddr);

  //Grant a role to the investment managers EOAs
  //the idea would be that each strategy would be transacted on by 1 EOA
  await assignRoles(
    accessControlSafeAddr,
    invRolesAddr,
    options.managerEOAs,
    MANAGER_ROLE_ID_V1,
    chainConfig
  );

  // Add signers
  await addSafeSigners(investmentSafeAddr, options.sysAdminAddresses, chainConfig);
  await addSafeSigners(accessControlSafeAddr, options.sysAdminAddresses, chainConfig);

  //Remove the deployer address as owner and rewrite signing threshold
  await removeDeployerAsOwner(investmentSafeAddr, options.invSafeThreshold);
  await removeDeployerAsOwner(accessControlSafeAddr, options.acSafeThreshold);

  return {
    acSafe: accessControlSafeAddr,
    invSafe: investmentSafeAddr,
    invRoles: invRolesAddr,
    acRoles: acRolesAddr,
  };
};
