import { LedgerSigner } from "@anders-t/ethers-ledger";
import {
    ContractRunner,
    Provider,
    TransactionRequest,
    TransactionResponse,
    JsonRpcProvider,
} from "ethers";

/**
 * Adapter class to make LedgerSigner compatible with ethers v6's ContractRunner interface
 */
export class LedgerSignerV6 implements ContractRunner {
    private signer: LedgerSigner;
    provider: Provider | null;

    constructor(signer: LedgerSigner, provider?: JsonRpcProvider) {
        this.signer = signer;
        // If a v6 provider is passed, use it. Otherwise try to adapt the v5 provider
        this.provider = provider || null;
    }

    async getAddress(): Promise<string> {
        return this.signer.getAddress();
    }

    async estimateGas(tx: TransactionRequest): Promise<bigint> {
        if (!this.provider) {
            throw new Error("Provider required for estimateGas");
        }
        const result = await this.provider.estimateGas(tx);
        return result;
    }

    async call(tx: TransactionRequest): Promise<string> {
        if (!this.provider) {
            throw new Error("Provider required for call");
        }
        return this.provider.call(tx);
    }

    async resolveName(name: string): Promise<null | string> {
        if (!this.provider) {
            throw new Error("Provider required for resolveName");
        }
        return this.provider.resolveName(name);
    }

    async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
        const signedTx = await this.signer.signTransaction(tx as any);
        if (!this.provider) {
            throw new Error("Provider required for sendTransaction");
        }
        return this.provider.broadcastTransaction(signedTx);
    }
} 