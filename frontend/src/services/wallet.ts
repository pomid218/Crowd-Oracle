import { UnisatSigner } from '@btc-vision/transaction';
import { networks } from '@btc-vision/bitcoin';
import { JSONRpcProvider } from 'opnet';
import type { WalletState } from '../types';

export class OPNetSigner extends UnisatSigner {
    get unisat(): any {
        if (typeof window === 'undefined') throw new Error('Window not found');
        const module = (window as any).opnet || (window as any).unisat;
        if (!module) throw new Error('OP Wallet extension not found.');
        return module;
    }
}

function getWalletProvider(): any | null {
    if (typeof window === 'undefined') return null;
    return (window as any).opnet || (window as any).unisat || null;
}

export async function connectWallet(): Promise<WalletState> {
    const w = getWalletProvider();
    if (!w) throw new Error('OP Wallet not installed. Please install it from the Chrome Web Store.');

    const accounts = await w.requestAccounts();
    if (!accounts?.length) throw new Error('No accounts returned from wallet');

    const address = accounts[0];
    const publicKey = await w.getPublicKey();
    const balance = await w.getBalance();
    const chain = await w.getChain();

    return {
        connected: true,
        address,
        publicKey,
        balance: balance?.total || 0,
        network: chain?.network || chain?.enum || 'testnet',
    };
}

export async function getBalance(): Promise<number> {
    const w = getWalletProvider();
    if (!w) return 0;
    try {
        const b = await w.getBalance();
        return b?.total || 0;
    } catch {
        return 0;
    }
}

export function createProvider(): JSONRpcProvider {
    const url = import.meta.env.VITE_OPNET_RPC_URL || 'https://testnet.opnet.org';
    return new JSONRpcProvider({ url, network: networks.testnet } as any);
}

export async function createSigner(): Promise<OPNetSigner> {
    const signer = new OPNetSigner();
    await signer.init();
    return signer;
}

export function getBitcoinNetwork(): any {
    return networks.testnet;
}

export function onAccountChange(callback: () => void): void {
    const w = getWalletProvider();
    w?.on('accountsChanged', callback);
}
