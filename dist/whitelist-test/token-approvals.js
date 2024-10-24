"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenApprovals = exports.approvals = void 0;
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const constants_2 = require("./curve/constants");
const curve3poolContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_3POOL_ADDR);
const sDaiAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.SDAI_ADDR);
const psmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.PSM_USDC_ADDR);
const joinPsmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.JOIN_PSM_USDC_ADDR);
const curveUsdcUsdeContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_USDC_USDE_ADDR);
const pendleRouterV4Encoded = (0, utils_1.getABICodedAddress)(constants_1.PENDLE_ROUTER_V4_ADDR);
const gpv2VaultRelayerEncoded = (0, utils_1.getABICodedAddress)(constants_1.GP_V2_VAULT_RELAYER);
const litePsmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.LITE_PSM_USDC_A_ADDR);
const susdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.SUSDE_ADDR);
const curve3poolZapEncoded = (0, utils_1.getABICodedAddress)(constants_2.zap3Pool);
const usd0PPEncoded = (0, utils_1.getABICodedAddress)(constants_1.USD0_PP_ADDR);
exports.approvals = {
    [constants_1.USDT_ADDR]: [gpv2VaultRelayerEncoded, curve3poolZapEncoded, curve3poolContractEncoded],
    [constants_1.DAI_ADDR]: [
        curve3poolZapEncoded,
        curve3poolContractEncoded,
        sDaiAddrEncoded,
        psmAddrEncoded,
        pendleRouterV4Encoded,
        gpv2VaultRelayerEncoded,
        litePsmAddrEncoded
    ],
    [constants_1.USDC_ADDR]: [
        curve3poolZapEncoded,
        curve3poolContractEncoded,
        joinPsmAddrEncoded,
        curveUsdcUsdeContractEncoded,
        pendleRouterV4Encoded,
        gpv2VaultRelayerEncoded,
        litePsmAddrEncoded
    ],
    [constants_1.USDE_ADDR]: [curveUsdcUsdeContractEncoded, pendleRouterV4Encoded, gpv2VaultRelayerEncoded, susdeEncoded],
    [constants_1.SUSDE_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded],
    [constants_1.MIM_ADDR]: [gpv2VaultRelayerEncoded, curve3poolZapEncoded],
    [constants_1.CRV_ADDR]: [gpv2VaultRelayerEncoded],
    [constants_1.CVX_ADDR]: [gpv2VaultRelayerEncoded],
    [constants_1.FXS_ADDR]: [gpv2VaultRelayerEncoded],
    [constants_1.USD0_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded, usd0PPEncoded],
    [constants_1.USD0_PP_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded],
    //PENDLE USDO 27 MAR
    [constants_1.PT_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.MARKET_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.SY_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.YT_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    //PENDLE USDE 26 DEC
    [constants_1.SY_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [constants_1.PT_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [constants_1.YT_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [constants_1.MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    //PENDLE USDE 27 MAR
    [constants_1.SY_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.PT_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.YT_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [constants_1.MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded]
};
//need to make sure the functions are already scoped on the specific contracts
async function tokenApprovals(roles) {
    const scopings = [];
    for (let i = 0; i < Object.keys(exports.approvals).length; i++) {
        const token = Object.keys(exports.approvals)[i];
        const approvalArray = exports.approvals[token];
        if (approvalArray.length > 1) {
            scopings.push(await roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, token, constants_1.APPROVAL_SIG, //@audit-info need to check if the approval sig is the same for all tokens? USDT?
            0, //parameter index
            constants_1.TYPE_STATIC, approvalArray));
        }
        else {
            scopings.push(await roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, token, constants_1.APPROVAL_SIG, [true, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY], [approvalArray[0], constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND));
        }
    }
    return scopings;
}
exports.tokenApprovals = tokenApprovals;
