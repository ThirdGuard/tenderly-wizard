import { ZeroAddress, id, zeroPadValue, encodeBytes32String } from "ethers";

export const SECURITY_ROLE_ID = 1;

export const SALTS = {
  safes: {
    investment: parseInt(
      encodeBytes32String("investment.salt").slice(2, 14),
      16
    ),
    accessControl: parseInt(
      encodeBytes32String("accessControl.salt").slice(2, 14),
      16
    ),
  },
};

export const MANAGER_ROLE_ID_V1 = 1;
export const SECURITY_ROLE_ID_V1 = 1;
export const MANAGER_ROLE_ID_V2 = encodeBytes32String("default") as `0x${string}`;
export const SECURITY_ROLE_ID_V2 = encodeBytes32String("security") as `0x${string}`;

export const SAFE_OPERATION_DELEGATECALL = 1;
export const ZERO_VALUE = 0;

export const OPTIONS_SEND = 1;
export const TYPE_STATIC = 0;
export const EQUAL_TO = 0;
export const ANY = 0;

export const GAS_LIMIT = BigInt("3000000");

export const EMPTY_BYTES = zeroPadValue("0x", 32);
export const APPROVAL_SIG = id("approve(address,uint256)")
  .substring(0, 10);

export const tx = {
  zeroValue: 0,
  operation: 0,
  avatarTxGas: 0,
  baseGas: 0,
  gasPrice: 0,
  gasToken: ZeroAddress,
  refundReceiver: ZeroAddress,
};

// Roles V1
// MAINNET safe & roles specific addresses
export const SAFE_MASTER_COPY_V1_ADDR =
  "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552"; //@note v 1.3.0
export const SAFE_PROXY_FACTORY_V1_ADDR =
  "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2";
export const SAFE_MODULE_PROXY_FACTORY_V1_ADDR =
  "0x00000000000DC7F163742Eb4aBEf650037b1f588";
export const ROLES_V1_MASTER_COPY_ADDR =
  "0xD8DfC1d938D7D163C5231688341e9635E9011889";
export const MULTISEND_V1_ADDR = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
export const DEFAULT_FALLBACK_HANDLER_V1_ADDR =
  "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4";

// Roles V2
// MAINNET safe & roles specific addresses
export const SAFE_MASTER_COPY_ADDR =
  "0x41675C099F32341bf84BFc5382aF534df5C7461a"; // @note v 1.4.0
export const SAFE_MODULE_PROXY_FACTORY_ADDR =
  "0x000000000000aDdB49795b0f9bA5BC298cDda236";
export const SAFE_PROXY_FACTORY_ADDR =
  "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
export const ROLES_V2_MASTER_COPY_ADDR =
  "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
export const MULTISEND_ADDR = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
export const DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";
export const DEFAULT_UNWRAPPER_ADDR =
  "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0";
export const MULTISEND_SELECTOR = "0x8d80ff0a";

// BASE safe & roles specific addresses
export const BASE_SAFE_MASTER_COPY_ADDR =
  "0x41675C099F32341bf84BFc5382aF534df5C7461a"; // @note v 1.4.0
export const BASE_SAFE_PROXY_FACTORY_ADDR =
  "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
export const BASE_SAFE_MODULE_PROXY_FACTORY_ADDR =
  "0x000000000000aDdB49795b0f9bA5BC298cDda236"; // @note v 1.2.0
export const BASE_ROLES_V2_MASTER_COPY_ADDR =
  "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
export const BASE_MULTISEND_ADDR = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
export const BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";
export const BASE_DEFAULT_UNWRAPPER_ADDR =
  "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0";
export const BASE_MULTISEND_SELECTOR = "0x8d80ff0a";

// contract addresses specific for sdai strategy
export const USDT_ADDR = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const DAI_ADDR = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const CURVE_3POOL_ADDR = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
export const SDAI_ADDR = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
export const JOIN_PSM_USDC_ADDR = "0x0A59649758aa4d66E25f08Dd01271e891fe52199";
export const PSM_USDC_ADDR = "0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A";

export const GPv2VaultRelayer_ETH =
  "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";
export const CowswapOrderSigner = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB";
