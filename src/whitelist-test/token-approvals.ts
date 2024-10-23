import { getABICodedAddress } from "./utils";
import {
    CURVE_3POOL_ADDR,
    SDAI_ADDR,
    LITE_PSM_USDC_A_ADDR,
    DAI_ADDR,
    USDC_ADDR,
    MANAGER_ROLE_ID,
    MULTISEND_ADDR,
    SAFE_OPERATION_DELEGATECALL,
    SECURITY_ROLE_ID,
    ZERO_VALUE,
    APPROVAL_SIG,
    TYPE_STATIC,
    EMPTY_BYTES,
    EQUAL_TO,
    ANY,
    OPTIONS_SEND,
    PSM_USDC_ADDR,
    JOIN_PSM_USDC_ADDR,
    GP_V2_VAULT_RELAYER,
    CURVE_USDC_USDE_ADDR,
    PENDLE_ROUTER_V4_ADDR,
    USDE_ADDR,
    SUSDE_ADDR,
    USDT_ADDR,
    MIM_ADDR,
    CRV_ADDR,
    CVX_ADDR,
    FXS_ADDR,
    USD0_ADDR,
    USD0_PP_ADDR,
    PT_USD0_PP_31_OCT_2024_ADDR,
    MARKET_USD0_PP_31_OCT_2024_ADDR,
    SY_USD0_PP_31_OCT_2024_ADDR,
    YT_USD0_PP_31_OCT_2024_ADDR,
    MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR,
    MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR,
    PT_ETHENA_SUSDE_26_DEC_2024_ADDR,
    PT_ETHENA_SUSDE_27_MAR_2025_ADDR,
    SY_ETHENA_SUSDE_26_DEC_2024_ADDR,
    SY_ETHENA_SUSDE_27_MAR_2025_ADDR,
    YT_ETHENA_SUSDE_26_DEC_2024_ADDR,
    YT_ETHENA_SUSDE_27_MAR_2025_ADDR,
    MARKET_USD0_PP_27_MAR_2025_ADDR,
    PT_USD0_PP_27_MAR_2025_ADDR,
    SY_USD0_PP_27_MAR_2025_ADDR,
    YT_USD0_PP_27_MAR_2025_ADDR,
} from "./constants";
import { Contract } from "ethers";
import { zap3Pool } from "./curve/constants";


const curve3poolContractEncoded = getABICodedAddress(CURVE_3POOL_ADDR);
const sDaiAddrEncoded = getABICodedAddress(SDAI_ADDR);
const psmAddrEncoded = getABICodedAddress(PSM_USDC_ADDR);
const joinPsmAddrEncoded = getABICodedAddress(JOIN_PSM_USDC_ADDR)
const curveUsdcUsdeContractEncoded = getABICodedAddress(CURVE_USDC_USDE_ADDR)
const pendleRouterV4Encoded = getABICodedAddress(PENDLE_ROUTER_V4_ADDR)
const gpv2VaultRelayerEncoded = getABICodedAddress(GP_V2_VAULT_RELAYER)
const litePsmAddrEncoded = getABICodedAddress(LITE_PSM_USDC_A_ADDR);
const susdeEncoded = getABICodedAddress(SUSDE_ADDR);
const curve3poolZapEncoded = getABICodedAddress(zap3Pool);
const usd0PPEncoded = getABICodedAddress(USD0_PP_ADDR)

export const approvals = {
    [USDT_ADDR]: [gpv2VaultRelayerEncoded, curve3poolZapEncoded, curve3poolContractEncoded],
    [DAI_ADDR]: [
        curve3poolZapEncoded,
        curve3poolContractEncoded,
        sDaiAddrEncoded,
        psmAddrEncoded,
        pendleRouterV4Encoded,
        gpv2VaultRelayerEncoded,
        litePsmAddrEncoded
    ],
    [USDC_ADDR]: [
        curve3poolZapEncoded,
        curve3poolContractEncoded,
        joinPsmAddrEncoded,
        curveUsdcUsdeContractEncoded,
        pendleRouterV4Encoded,
        gpv2VaultRelayerEncoded,
        litePsmAddrEncoded
    ],
    [USDE_ADDR]: [curveUsdcUsdeContractEncoded, pendleRouterV4Encoded, gpv2VaultRelayerEncoded, susdeEncoded],
    [SUSDE_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded],
    [MIM_ADDR]: [gpv2VaultRelayerEncoded, curve3poolZapEncoded],
    [CRV_ADDR]: [gpv2VaultRelayerEncoded],
    [CVX_ADDR]: [gpv2VaultRelayerEncoded],
    [FXS_ADDR]: [gpv2VaultRelayerEncoded],
    [USD0_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded, usd0PPEncoded],
    [USD0_PP_ADDR]: [pendleRouterV4Encoded, gpv2VaultRelayerEncoded],
    //PENDLE USDO 27 MAR
    [PT_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [MARKET_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [SY_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [YT_USD0_PP_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    //PENDLE USDE 26 DEC
    [SY_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [PT_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [YT_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    [MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR]: [pendleRouterV4Encoded],
    //PENDLE USDE 27 MAR
    [SY_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [PT_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [YT_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded],
    [MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR]: [pendleRouterV4Encoded]
}

//need to make sure the functions are already scoped on the specific contracts
export async function tokenApprovals(roles: Contract) {
    const scopings = [];
    for (let i = 0; i < Object.keys(approvals).length; i++) {
        const token = Object.keys(approvals)[i];
        const approvalArray = (approvals as any)[token];
        if (approvalArray.length > 1) {
            scopings.push(await roles.populateTransaction.scopeParameterAsOneOf(
                MANAGER_ROLE_ID,
                token,
                APPROVAL_SIG, //@audit-info need to check if the approval sig is the same for all tokens? USDT?
                0, //parameter index
                TYPE_STATIC,
                approvalArray
            ))
        } else {
            scopings.push(await roles.populateTransaction.scopeFunction(
                MANAGER_ROLE_ID,
                token,
                APPROVAL_SIG,
                [true, false],
                [TYPE_STATIC, TYPE_STATIC],
                [EQUAL_TO, ANY],
                [approvalArray[0], EMPTY_BYTES],
                OPTIONS_SEND
            ));
        }
    }
    return scopings
}