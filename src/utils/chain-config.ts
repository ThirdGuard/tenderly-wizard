import { ChainId } from "zodiac-roles-sdk";
import {
  ROLES_V2_MASTER_COPY_ADDR,
  SAFE_MODULE_PROXY_FACTORY_ADDR,
  MULTISEND_ADDR,
  DEFAULT_FALLBACK_HANDLER_ADDRESS,
  DEFAULT_UNWRAPPER_ADDR,
  MULTISEND_SELECTOR,
  SAFE_MASTER_COPY_ADDR,
  SAFE_PROXY_FACTORY_ADDR,
  BASE_ROLES_V2_MASTER_COPY_ADDR,
  BASE_SAFE_MODULE_PROXY_FACTORY_ADDR,
  BASE_MULTISEND_ADDR,
  BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS,
  BASE_DEFAULT_UNWRAPPER_ADDR,
  BASE_MULTISEND_SELECTOR,
  BASE_SAFE_MASTER_COPY_ADDR,
  BASE_SAFE_PROXY_FACTORY_ADDR,
} from "./constants";

export interface ChainConfig {
  ROLES_V2_MASTER_COPY_ADDR: string;
  SAFE_MODULE_PROXY_FACTORY_ADDR: string;
  MULTISEND_ADDR: string;
  DEFAULT_FALLBACK_HANDLER_ADDRESS: string;
  DEFAULT_UNWRAPPER_ADDR: string;
  MULTISEND_SELECTOR: string;
  SAFE_MASTER_COPY_ADDR: string;
  SAFE_PROXY_FACTORY_ADDR: string;
}

const chainConfigs: Partial<Record<ChainId, ChainConfig>> = {
  [1]: {
    ROLES_V2_MASTER_COPY_ADDR: ROLES_V2_MASTER_COPY_ADDR,
    SAFE_MODULE_PROXY_FACTORY_ADDR: SAFE_MODULE_PROXY_FACTORY_ADDR,
    MULTISEND_ADDR: MULTISEND_ADDR,
    DEFAULT_FALLBACK_HANDLER_ADDRESS: DEFAULT_FALLBACK_HANDLER_ADDRESS,
    DEFAULT_UNWRAPPER_ADDR: DEFAULT_UNWRAPPER_ADDR,
    MULTISEND_SELECTOR: MULTISEND_SELECTOR,
    SAFE_MASTER_COPY_ADDR: SAFE_MASTER_COPY_ADDR,
    SAFE_PROXY_FACTORY_ADDR: SAFE_PROXY_FACTORY_ADDR,
  },
  [8453]: {
    ROLES_V2_MASTER_COPY_ADDR: BASE_ROLES_V2_MASTER_COPY_ADDR,
    SAFE_MODULE_PROXY_FACTORY_ADDR: BASE_SAFE_MODULE_PROXY_FACTORY_ADDR,
    MULTISEND_ADDR: BASE_MULTISEND_ADDR,
    DEFAULT_FALLBACK_HANDLER_ADDRESS: BASE_DEFAULT_FALLBACK_HANDLER_ADDRESS,
    DEFAULT_UNWRAPPER_ADDR: BASE_DEFAULT_UNWRAPPER_ADDR,
    MULTISEND_SELECTOR: BASE_MULTISEND_SELECTOR,
    SAFE_MASTER_COPY_ADDR: BASE_SAFE_MASTER_COPY_ADDR,
    SAFE_PROXY_FACTORY_ADDR: BASE_SAFE_PROXY_FACTORY_ADDR,
  },
  // @note Add configurations for other chains here
};

export function getChainConfig(chainId: ChainId): ChainConfig {
  const config = chainConfigs[chainId];
  if (!config) {
    throw new Error(`No configuration found for chain ID ${chainId}`);
  }
  return config;
}