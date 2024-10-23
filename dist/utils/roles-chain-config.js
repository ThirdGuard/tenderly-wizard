"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChainConfig = void 0;
const constants_1 = require("./constants");
const chainConfigs = {
    [1]: {
        v1: {
            ROLES_MASTER_COPY_ADDR: constants_1.ROLES_V1_MASTER_COPY_ADDR,
            SAFE_MODULE_PROXY_FACTORY_ADDR: constants_1.SAFE_MODULE_PROXY_FACTORY_V1_ADDR,
            MULTISEND_ADDR: constants_1.MULTISEND_V1_ADDR,
            DEFAULT_FALLBACK_HANDLER_ADDRESS: constants_1.DEFAULT_FALLBACK_HANDLER_V1_ADDR,
            DEFAULT_UNWRAPPER_ADDR: constants_1.DEFAULT_UNWRAPPER_ADDR,
            MULTISEND_SELECTOR: constants_1.MULTISEND_SELECTOR,
            SAFE_MASTER_COPY_ADDR: constants_1.SAFE_MASTER_COPY_V1_ADDR,
            SAFE_PROXY_FACTORY_ADDR: constants_1.SAFE_PROXY_FACTORY_V1_ADDR
        },
        v2: {
            ROLES_MASTER_COPY_ADDR: constants_1.ROLES_V2_MASTER_COPY_ADDR,
            SAFE_MODULE_PROXY_FACTORY_ADDR: constants_1.SAFE_MODULE_PROXY_FACTORY_ADDR,
            MULTISEND_ADDR: constants_1.MULTISEND_ADDR,
            DEFAULT_FALLBACK_HANDLER_ADDRESS: constants_1.DEFAULT_FALLBACK_HANDLER_ADDRESS,
            DEFAULT_UNWRAPPER_ADDR: constants_1.DEFAULT_UNWRAPPER_ADDR,
            MULTISEND_SELECTOR: constants_1.MULTISEND_SELECTOR,
            SAFE_MASTER_COPY_ADDR: constants_1.SAFE_MASTER_COPY_ADDR,
            SAFE_PROXY_FACTORY_ADDR: constants_1.SAFE_PROXY_FACTORY_ADDR,
        }
    },
    [8453]: {
        v1: {
            ROLES_MASTER_COPY_ADDR: constants_1.ROLES_V1_MASTER_COPY_ADDR,
            SAFE_MODULE_PROXY_FACTORY_ADDR: constants_1.SAFE_MODULE_PROXY_FACTORY_V1_ADDR,
            MULTISEND_ADDR: constants_1.MULTISEND_V1_ADDR,
            DEFAULT_FALLBACK_HANDLER_ADDRESS: constants_1.DEFAULT_FALLBACK_HANDLER_V1_ADDR,
            DEFAULT_UNWRAPPER_ADDR: "",
            MULTISEND_SELECTOR: "",
            SAFE_MASTER_COPY_ADDR: constants_1.SAFE_MASTER_COPY_V1_ADDR,
            SAFE_PROXY_FACTORY_ADDR: constants_1.SAFE_PROXY_FACTORY_V1_ADDR
        },
        v2: {
            ROLES_MASTER_COPY_ADDR: constants_1.BASE_ROLES_V2_MASTER_COPY_ADDR,
            SAFE_MODULE_PROXY_FACTORY_ADDR: constants_1.BASE_SAFE_MODULE_PROXY_FACTORY_ADDR,
            MULTISEND_ADDR: constants_1.BASE_MULTISEND_ADDR,
            DEFAULT_FALLBACK_HANDLER_ADDRESS: constants_1.BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS,
            DEFAULT_UNWRAPPER_ADDR: constants_1.BASE_DEFAULT_UNWRAPPER_ADDR,
            MULTISEND_SELECTOR: constants_1.BASE_MULTISEND_SELECTOR,
            SAFE_MASTER_COPY_ADDR: constants_1.BASE_SAFE_MASTER_COPY_ADDR,
            SAFE_PROXY_FACTORY_ADDR: constants_1.BASE_SAFE_PROXY_FACTORY_ADDR,
        }
    },
    // @note Add configurations for other chains here
};
function getChainConfig(chainId, rolesVersion) {
    var _a;
    const config = (_a = chainConfigs[chainId]) === null || _a === void 0 ? void 0 : _a[rolesVersion];
    if (!config) {
        throw new Error(`No configuration found for chain ID ${chainId} and roles version ${rolesVersion}`);
    }
    return config;
}
exports.getChainConfig = getChainConfig;
