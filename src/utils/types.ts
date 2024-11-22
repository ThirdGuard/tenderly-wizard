export interface ChainConfig {
  v1: {
    ROLES_MASTER_COPY_ADDR: string;
    SAFE_MODULE_PROXY_FACTORY_ADDR: string;
    MULTISEND_ADDR: string;
    DEFAULT_FALLBACK_HANDLER_ADDRESS: string;
    DEFAULT_UNWRAPPER_ADDR: string;
    MULTISEND_SELECTOR: string;
    SAFE_MASTER_COPY_ADDR: string;
    SAFE_PROXY_FACTORY_ADDR: string;
  };
  v2: {
    ROLES_MASTER_COPY_ADDR: string;
    SAFE_MODULE_PROXY_FACTORY_ADDR: string;
    MULTISEND_ADDR: string;
    DEFAULT_FALLBACK_HANDLER_ADDRESS: string;
    DEFAULT_UNWRAPPER_ADDR: string;
    MULTISEND_SELECTOR: string;
    SAFE_MASTER_COPY_ADDR: string;
    SAFE_PROXY_FACTORY_ADDR: string;
  };
}

export type RolesVersion = "v1" | "v2";
