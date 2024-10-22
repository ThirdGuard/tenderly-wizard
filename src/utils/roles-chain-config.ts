import { ChainId } from "zodiac-roles-sdk";
import {
  ROLES_V2_MASTER_COPY_ADDR,
  SAFE_MODULE_PROXY_FACTORY_ADDR,
  MULTISEND_ADDR,
  DEFAULT_FALLBACK_HANDLER_ADDRESS,
  DEFAULT_UNWRAPPER_ADDR,
  MULTISEND_SELECTOR,
  SAFE_MASTER_COPY_V1_ADDR,
  SAFE_PROXY_FACTORY_ADDR,
  BASE_ROLES_V2_MASTER_COPY_ADDR,
  BASE_SAFE_MODULE_PROXY_FACTORY_ADDR,
  BASE_MULTISEND_ADDR,
  BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS,
  BASE_DEFAULT_UNWRAPPER_ADDR,
  BASE_MULTISEND_SELECTOR,
  BASE_SAFE_MASTER_COPY_ADDR,
  BASE_SAFE_PROXY_FACTORY_ADDR,
  SAFE_MODULE_PROXY_FACTORY_V1_ADDR,
  DEFAULT_FALLBACK_HANDLER_V1_ADDR,
  MULTISEND_V1_ADDR,
  ROLES_V1_MASTER_COPY_ADDR,
  SAFE_MASTER_COPY_ADDR,
  SAFE_PROXY_FACTORY_V1_ADDR,
} from "./constants";
import { ChainConfig, RolesVersion } from "./types";

const chainConfigs: Partial<Record<ChainId, ChainConfig>> = {
  [1]: {
    v1: {
      ROLES_MASTER_COPY_ADDR: ROLES_V1_MASTER_COPY_ADDR,
      SAFE_MODULE_PROXY_FACTORY_ADDR: SAFE_MODULE_PROXY_FACTORY_V1_ADDR,
      MULTISEND_ADDR: MULTISEND_V1_ADDR,
      DEFAULT_FALLBACK_HANDLER_ADDRESS: DEFAULT_FALLBACK_HANDLER_V1_ADDR,
      DEFAULT_UNWRAPPER_ADDR: "",
      MULTISEND_SELECTOR: "",
      SAFE_MASTER_COPY_ADDR: SAFE_MASTER_COPY_V1_ADDR,
      SAFE_PROXY_FACTORY_ADDR: SAFE_PROXY_FACTORY_V1_ADDR
    },
    v2: {
      ROLES_MASTER_COPY_ADDR: ROLES_V2_MASTER_COPY_ADDR,
      SAFE_MODULE_PROXY_FACTORY_ADDR: SAFE_MODULE_PROXY_FACTORY_ADDR,
      MULTISEND_ADDR: MULTISEND_ADDR,
      DEFAULT_FALLBACK_HANDLER_ADDRESS: DEFAULT_FALLBACK_HANDLER_ADDRESS,
      DEFAULT_UNWRAPPER_ADDR: DEFAULT_UNWRAPPER_ADDR,
      MULTISEND_SELECTOR: MULTISEND_SELECTOR,
      SAFE_MASTER_COPY_ADDR: SAFE_MASTER_COPY_ADDR,
      SAFE_PROXY_FACTORY_ADDR: SAFE_PROXY_FACTORY_ADDR,
    }

  },
  [8453]: {
    v1: {
      ROLES_MASTER_COPY_ADDR: ROLES_V1_MASTER_COPY_ADDR,
      SAFE_MODULE_PROXY_FACTORY_ADDR: SAFE_MODULE_PROXY_FACTORY_V1_ADDR,
      MULTISEND_ADDR: MULTISEND_V1_ADDR,
      DEFAULT_FALLBACK_HANDLER_ADDRESS: DEFAULT_FALLBACK_HANDLER_V1_ADDR,
      DEFAULT_UNWRAPPER_ADDR: "",
      MULTISEND_SELECTOR: "",
      SAFE_MASTER_COPY_ADDR: SAFE_MASTER_COPY_V1_ADDR,
      SAFE_PROXY_FACTORY_ADDR: SAFE_PROXY_FACTORY_V1_ADDR
    },
    v2: {
      ROLES_MASTER_COPY_ADDR: BASE_ROLES_V2_MASTER_COPY_ADDR,
      SAFE_MODULE_PROXY_FACTORY_ADDR: BASE_SAFE_MODULE_PROXY_FACTORY_ADDR,
      MULTISEND_ADDR: BASE_MULTISEND_ADDR,
      DEFAULT_FALLBACK_HANDLER_ADDRESS: BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS,
      DEFAULT_UNWRAPPER_ADDR: BASE_DEFAULT_UNWRAPPER_ADDR,
      MULTISEND_SELECTOR: BASE_MULTISEND_SELECTOR,
      SAFE_MASTER_COPY_ADDR: BASE_SAFE_MASTER_COPY_ADDR,
      SAFE_PROXY_FACTORY_ADDR: BASE_SAFE_PROXY_FACTORY_ADDR,
    }
  },
  // @note Add configurations for other chains here
};

export function getChainConfig(chainId: ChainId, rolesVersion: RolesVersion): ChainConfig[RolesVersion] {
  const config = chainConfigs[chainId][rolesVersion];
  if (!config) {
    throw new Error(`No configuration found for chain ID ${chainId} and roles version ${rolesVersion}`);
  }
  return config;
}
