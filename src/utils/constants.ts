import { BigNumber, constants, utils } from "ethers";
import { encodeBytes32String } from "./util";

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
export const MANAGER_ROLE_ID_V2 = encodeBytes32String("default");
export const SECURITY_ROLE_ID_V2 = encodeBytes32String("security");

export const SAFE_OPERATION_DELEGATECALL = 1;
export const SAFE_OPERATION_CALL = 0;
export const ZERO_VALUE = 0;

export const OPTIONS_NONE = 0;
export const OPTIONS_SEND = 1;
export const OPTIONS_DELEGATECALL = 2;
export const TYPE_STATIC = 0;
export const TYPE_DYNAMIC = 1;
export const TYPE_DYNAMIC32 = 2;
export const EQUAL_TO = 0;
export const LESS_THAN = 1;
export const GREATER_THAN = 2;
export const ANY = 0;
export const ONE_OF = 3;

export const GAS_LIMIT = BigNumber.from("3000000");

export const EMPTY_BYTES = utils.hexZeroPad("0x", 32);
export const EMPTY_LIMIT_DATA = {
  limitRouter: "0x0000000000000000000000000000000000000000",
  epsSkipMarket: "0",
  normalFills: [],
  flashFills: [],
  optData: "0x",
};
export const APPROVAL_SIG = utils
  .id("approve(address,uint256)")
  .substring(0, 10);

export const tx = {
  zeroValue: 0,
  operation: 0,
  avatarTxGas: 0,
  baseGas: 0,
  gasPrice: 0,
  gasToken: constants.AddressZero,
  refundReceiver: constants.AddressZero,
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
export const PERMISSIONS_V1_LIB = "0x33D1C5A5B6a7f3885c7467e829aaa21698937597";
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
export const PERMISSIONS_LIB = "0x33D1C5A5B6a7f3885c7467e829aaa21698937597";
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
// export const BASE_ROLES_V1_MASTER_COPY_ADDR = "0xD8DfC1d938D7D163C5231688341e9635E9011889"; // @note v 1.1.0
export const BASE_ROLES_V2_MASTER_COPY_ADDR =
  "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
export const BASE_PERMISSIONS_LIB =
  "0x33D1C5A5B6a7f3885c7467e829aaa21698937597";
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

// Pendle USDE
export const USDE_ADDR = "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3";
export const SUSDE_ADDR = "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497";
export const SY_SUSDE_ADDR = "0x1605a410c8480a18a3e958faff3b6d2834fbae22";
export const PT_ETHENA_SUSDE_24_OCT_2024_ADDR =
  "0xAE5099C39f023C91d3dd55244CAFB36225B0850E";
export const YT_ETHENA_SUSDE_24_OCT_2024_ADDR =
  "0x279e76FA6310976dc651c5F48EC7e768e9e2CCb4";
export const CURVE_USDC_USDE_ADDR =
  "0x02950460e2b9529d0e00284a5fa2d7bdf3fa4d72";
export const PENDLE_ROUTER_V4_ADDR =
  "0x888888888889758F76e7103c6CbF23ABbF58F946";
export const MARKET_ETHENA_SUSDE_24_OCT_2024_ADDR =
  "0xbBf399db59A845066aAFce9AE55e68c505FA97B7";
export const PENDLE_SDK_API_URL = "https://api-v2.pendle.finance/sdk/api";
export const PENDLE_TOKEN_ADDR = "0x808507121B80c02388fAd14726482e061B8da827";

export const GPv2VaultRelayer_ETH =
  "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";
export const CowswapOrderSigner = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB";

// Aerodrome - Base network contracts
export const BASE_DOLA_ADDR = "0x4621b7A9c75199271F773Ebd9A499dbd165c3191";
export const BASE_USDC_ADDR = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_AERO_ADDR = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
export const BASE_AERODROME_ROUTER_ADDR =
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
export const BASE_AERODROME_DEFAULT_FACTORY_ADDR =
  "0x420DD381b31aEf6683db6B902084cB0FFECe40Da";
export const BASE_AERODROME_GUAGE_ADDR =
  "0xCCff5627cd544b4cBb7d048139C1A6b6Bde67885";
export const BASE_USDC_DOLLA_AMM_ADDR =
  "0xf213F2D02837012dC0236cC105061e121bB03e37";
