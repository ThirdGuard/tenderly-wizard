"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUSDE_ADDR = exports.USDE_ADDR = exports.PSM_USDC_ADDR = exports.JOIN_PSM_USDC_ADDR = exports.SDAI_ADDR = exports.CURVE_3POOL_ADDR = exports.DAI_ADDR = exports.USDC_ADDR = exports.USDT_ADDR = exports.BASE_MULTISEND_SELECTOR = exports.BASE_DEFAULT_UNWRAPPER_ADDR = exports.BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS = exports.BASE_MULTISEND_ADDR = exports.BASE_PERMISSIONS_LIB = exports.BASE_ROLES_V2_MASTER_COPY_ADDR = exports.BASE_SAFE_MODULE_PROXY_FACTORY_ADDR = exports.BASE_SAFE_PROXY_FACTORY_ADDR = exports.BASE_SAFE_MASTER_COPY_ADDR = exports.MULTISEND_SELECTOR = exports.DEFAULT_UNWRAPPER_ADDR = exports.DEFAULT_FALLBACK_HANDLER_ADDRESS = exports.MULTISEND_ADDR = exports.PERMISSIONS_LIB = exports.ROLES_V2_MASTER_COPY_ADDR = exports.SAFE_PROXY_FACTORY_ADDR = exports.SAFE_MODULE_PROXY_FACTORY_ADDR = exports.SAFE_MASTER_COPY_ADDR = exports.tx = exports.APPROVAL_SIG = exports.EMPTY_LIMIT_DATA = exports.EMPTY_BYTES = exports.GAS_LIMIT = exports.ONE_OF = exports.ANY = exports.GREATER_THAN = exports.LESS_THAN = exports.EQUAL_TO = exports.TYPE_DYNAMIC32 = exports.TYPE_DYNAMIC = exports.TYPE_STATIC = exports.OPTIONS_DELEGATECALL = exports.OPTIONS_SEND = exports.OPTIONS_NONE = exports.COWSWAP_ORDER_SIGNER = exports.ZERO_VALUE = exports.SAFE_OPERATION_CALL = exports.SAFE_OPERATION_DELEGATECALL = exports.SECURITY_ROLE_ID = exports.MANAGER_ROLE_ID = exports.AMOUNTS = void 0;
exports.LITE_PSM_USDC_A_ADDR = exports.USUAL_TOKEN_ADDR = exports.USYC_ADDR = exports.CURVE_USDC_USD0_ADDR = exports.USD0_PP_ADDR = exports.USD0_ADDR = exports.MARKET_USD0_PP_27_MAR_2025_ADDR = exports.YT_USD0_PP_27_MAR_2025_ADDR = exports.PT_USD0_PP_27_MAR_2025_ADDR = exports.SY_USD0_PP_27_MAR_2025_ADDR = exports.MARKET_USD0_PP_31_OCT_2024_ADDR = exports.YT_USD0_PP_31_OCT_2024_ADDR = exports.PT_USD0_PP_31_OCT_2024_ADDR = exports.SY_USD0_PP_31_OCT_2024_ADDR = exports.MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR = exports.YT_ETHENA_SUSDE_27_MAR_2025_ADDR = exports.PT_ETHENA_SUSDE_27_MAR_2025_ADDR = exports.SY_ETHENA_SUSDE_27_MAR_2025_ADDR = exports.MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR = exports.YT_ETHENA_SUSDE_26_DEC_2024_ADDR = exports.PT_ETHENA_SUSDE_26_DEC_2024_ADDR = exports.SY_ETHENA_SUSDE_26_DEC_2024_ADDR = exports.GP_V2_VAULT_RELAYER = exports.INDEX_TOKEN_OUT_REMOVE_LIQUIDITY_SINGLE_TOKEN = exports.INDEX_SWAP_TYPE_REDEEM_SY_TO_TOKEN = exports.INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN = exports.MIM_CRV_REWARDS_ADDR = exports.FRAXBP_ADDR = exports.FXS_ADDR = exports.CVX_ADDR = exports.CRV_ADDR = exports.MIM_LP_ADDR = exports.MIM_ADDR = exports.BASE_USDC_DOLLA_AMM_ADDR = exports.BASE_AERODROME_GUAGE_ADDR = exports.BASE_AERODROME_DEFAULT_FACTORY_ADDR = exports.BASE_AERODROME_ROUTER_ADDR = exports.BASE_AERO_ADDR = exports.BASE_USDC_ADDR = exports.BASE_DOLA_ADDR = exports.CowswapOrderSigner = exports.GPv2VaultRelayer_ETH = exports.PENDLE_TOKEN_ADDR = exports.PENDLE_SDK_API_URL = exports.MARKET_ETHENA_SUSDE_24_OCT_2024_ADDR = exports.PENDLE_ROUTER_V4_ADDR = exports.CURVE_USDC_USDE_ADDR = exports.YT_ETHENA_SUSDE_24_OCT_2024_ADDR = exports.PT_ETHENA_SUSDE_24_OCT_2024_ADDR = exports.SY_SUSDE_ADDR = void 0;
exports.AMOUNTS = {
    one: "1",
    ten: "10",
    hundred: "100",
    thousand: "1000",
    ten_thousand: "10000",
    hundred_thousand: "100000",
    million: "1000000",
};
exports.MANAGER_ROLE_ID = 1;
exports.SECURITY_ROLE_ID = 1;
exports.SAFE_OPERATION_DELEGATECALL = 1;
exports.SAFE_OPERATION_CALL = 0;
exports.ZERO_VALUE = 0;
exports.COWSWAP_ORDER_SIGNER = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB";
exports.OPTIONS_NONE = 0;
exports.OPTIONS_SEND = 1;
exports.OPTIONS_DELEGATECALL = 2;
exports.TYPE_STATIC = 0;
exports.TYPE_DYNAMIC = 1;
exports.TYPE_DYNAMIC32 = 2;
exports.EQUAL_TO = 0;
exports.LESS_THAN = 1;
exports.GREATER_THAN = 2;
exports.ANY = 0;
exports.ONE_OF = 3;
const hre = require("hardhat");
exports.GAS_LIMIT = hre.ethers.BigNumber.from("3000000");
exports.EMPTY_BYTES = hre.ethers.utils.hexZeroPad("0x", 32);
exports.EMPTY_LIMIT_DATA = {
    limitRouter: "0x0000000000000000000000000000000000000000",
    epsSkipMarket: "0",
    normalFills: [],
    flashFills: [],
    optData: "0x",
};
exports.APPROVAL_SIG = hre.ethers.utils
    .id("approve(address,uint256)")
    .substring(0, 10);
exports.tx = {
    zeroValue: 0,
    operation: 0,
    avatarTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: hre.ethers.constants.AddressZero,
    refundReceiver: hre.ethers.constants.AddressZero,
};
// MAINNET safe & roles specific addresses
exports.SAFE_MASTER_COPY_ADDR = "0x41675C099F32341bf84BFc5382aF534df5C7461a"; // @note v 1.4.0
exports.SAFE_MODULE_PROXY_FACTORY_ADDR = "0x000000000000aDdB49795b0f9bA5BC298cDda236";
exports.SAFE_PROXY_FACTORY_ADDR = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
exports.ROLES_V2_MASTER_COPY_ADDR = "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
exports.PERMISSIONS_LIB = "0x33D1C5A5B6a7f3885c7467e829aaa21698937597";
// export const MULTISEND_ADDR = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"; // call only 
exports.MULTISEND_ADDR = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
// export const MULTISEND_ADDR = "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526";
exports.DEFAULT_FALLBACK_HANDLER_ADDRESS = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";
exports.DEFAULT_UNWRAPPER_ADDR = "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0";
exports.MULTISEND_SELECTOR = "0x8d80ff0a";
// BASE safe & roles specific addresses
exports.BASE_SAFE_MASTER_COPY_ADDR = "0x41675C099F32341bf84BFc5382aF534df5C7461a"; // @note v 1.4.0
exports.BASE_SAFE_PROXY_FACTORY_ADDR = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
exports.BASE_SAFE_MODULE_PROXY_FACTORY_ADDR = "0x000000000000aDdB49795b0f9bA5BC298cDda236"; // @note v 1.2.0
// export const BASE_ROLES_V1_MASTER_COPY_ADDR = "0xD8DfC1d938D7D163C5231688341e9635E9011889"; // @note v 1.1.0
exports.BASE_ROLES_V2_MASTER_COPY_ADDR = "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
exports.BASE_PERMISSIONS_LIB = "0x33D1C5A5B6a7f3885c7467e829aaa21698937597";
// export const BASE_MULTISEND_ADDR = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"; // call only
exports.BASE_MULTISEND_ADDR = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
// export const BASE_MULTISEND_ADDR = "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526";
exports.BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";
exports.BASE_DEFAULT_UNWRAPPER_ADDR = "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0";
exports.BASE_MULTISEND_SELECTOR = "0x8d80ff0a";
// contract addresses specific for sdai strategy
exports.USDT_ADDR = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
exports.USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
exports.DAI_ADDR = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
exports.CURVE_3POOL_ADDR = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
exports.SDAI_ADDR = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
exports.JOIN_PSM_USDC_ADDR = "0x0A59649758aa4d66E25f08Dd01271e891fe52199";
exports.PSM_USDC_ADDR = "0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A";
// Pendle USDE
exports.USDE_ADDR = "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3";
exports.SUSDE_ADDR = "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497";
exports.SY_SUSDE_ADDR = "0x1605a410c8480a18a3e958faff3b6d2834fbae22";
exports.PT_ETHENA_SUSDE_24_OCT_2024_ADDR = "0xAE5099C39f023C91d3dd55244CAFB36225B0850E";
exports.YT_ETHENA_SUSDE_24_OCT_2024_ADDR = "0x279e76FA6310976dc651c5F48EC7e768e9e2CCb4";
exports.CURVE_USDC_USDE_ADDR = "0x02950460e2b9529d0e00284a5fa2d7bdf3fa4d72";
exports.PENDLE_ROUTER_V4_ADDR = "0x888888888889758F76e7103c6CbF23ABbF58F946";
exports.MARKET_ETHENA_SUSDE_24_OCT_2024_ADDR = "0xbBf399db59A845066aAFce9AE55e68c505FA97B7";
exports.PENDLE_SDK_API_URL = "https://api-v2.pendle.finance/sdk/api";
exports.PENDLE_TOKEN_ADDR = "0x808507121B80c02388fAd14726482e061B8da827";
exports.GPv2VaultRelayer_ETH = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";
exports.CowswapOrderSigner = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB";
// Aerodrome - Base network contracts
exports.BASE_DOLA_ADDR = "0x4621b7A9c75199271F773Ebd9A499dbd165c3191";
exports.BASE_USDC_ADDR = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
exports.BASE_AERO_ADDR = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
exports.BASE_AERODROME_ROUTER_ADDR = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
exports.BASE_AERODROME_DEFAULT_FACTORY_ADDR = "0x420DD381b31aEf6683db6B902084cB0FFECe40Da";
exports.BASE_AERODROME_GUAGE_ADDR = "0xCCff5627cd544b4cBb7d048139C1A6b6Bde67885";
exports.BASE_USDC_DOLLA_AMM_ADDR = "0xf213F2D02837012dC0236cC105061e121bB03e37";
exports.MIM_ADDR = "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3";
exports.MIM_LP_ADDR = "0x5a6A4D54456819380173272A5E8E9B9904BdF41B";
exports.CRV_ADDR = "0xD533a949740bb3306d119CC777fa900bA034cd52";
exports.CVX_ADDR = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
exports.FXS_ADDR = "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0";
exports.FRAXBP_ADDR = "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2";
exports.MIM_CRV_REWARDS_ADDR = "0xFd5AbF66b003881b88567EB9Ed9c651F14Dc4771";
// Pendle param indexes
exports.INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN = 5;
exports.INDEX_SWAP_TYPE_REDEEM_SY_TO_TOKEN = 9;
exports.INDEX_TOKEN_OUT_REMOVE_LIQUIDITY_SINGLE_TOKEN = 5;
exports.GP_V2_VAULT_RELAYER = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";
//Pendle USDE 26 DEC
exports.SY_ETHENA_SUSDE_26_DEC_2024_ADDR = "0xD288755556c235afFfb6316702719C32bD8706e8";
exports.PT_ETHENA_SUSDE_26_DEC_2024_ADDR = "0xEe9085fC268F6727d5D4293dBABccF901ffDCC29";
exports.YT_ETHENA_SUSDE_26_DEC_2024_ADDR = "0xbE05538f48D76504953c5d1068898C6642937427";
exports.MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR = "0xa0ab94DeBB3cC9A7eA77f3205ba4AB23276feD08";
//Pendle USDE 27 MAR
exports.SY_ETHENA_SUSDE_27_MAR_2025_ADDR = "0x3Ee118EFC826d30A29645eAf3b2EaaC9E8320185";
exports.PT_ETHENA_SUSDE_27_MAR_2025_ADDR = "0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81";
exports.YT_ETHENA_SUSDE_27_MAR_2025_ADDR = "0x96512230bF0Fa4E20Cf02C3e8A7d983132cd2b9F";
exports.MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR = "0xcDd26Eb5EB2Ce0f203a84553853667aE69Ca29Ce";
// Pendle USD0 
// 31 OCT 24 term
exports.SY_USD0_PP_31_OCT_2024_ADDR = "0x47bCE1BB5D9A9072161EC25009bcD6e8d367b7D3";
exports.PT_USD0_PP_31_OCT_2024_ADDR = "0x270d664d2Fc7D962012a787Aec8661CA83DF24EB";
exports.YT_USD0_PP_31_OCT_2024_ADDR = "0x4f0B4e6512630480B868e62a8A1D3451B0e9192d";
exports.MARKET_USD0_PP_31_OCT_2024_ADDR = "0x00b321D89A8C36B3929f20B7955080baeD706D1B";
//27 MAR 25 term
exports.SY_USD0_PP_27_MAR_2025_ADDR = "0x52453825c287dDef62D647ce51C0979D27c461f7";
exports.PT_USD0_PP_27_MAR_2025_ADDR = "0x5BaE9a5D67d1CA5b09B14c91935f635CFBF3b685";
exports.YT_USD0_PP_27_MAR_2025_ADDR = "0x5b9089418248033FaDC4Dad3F8AE9a6b558A7Da2";
exports.MARKET_USD0_PP_27_MAR_2025_ADDR = "0xaFDC922d0059147486cC1F0f32e3A2354b0d35CC";
//Other USD0
exports.USD0_ADDR = "0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5";
exports.USD0_PP_ADDR = "0x35D8949372D46B7a3D5A56006AE77B215fc69bC0";
exports.CURVE_USDC_USD0_ADDR = "0x14100f81e33c33ecc7cdac70181fb45b6e78569f";
exports.USYC_ADDR = "0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b";
exports.USUAL_TOKEN_ADDR = "";
// Lite PSM USDC A
exports.LITE_PSM_USDC_A_ADDR = "0xf6e72Db5454dd049d0788e411b06CfAF16853042";