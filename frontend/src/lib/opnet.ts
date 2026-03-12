import { getCrowdOracleContract, CONTRACT_ADDRESS, DEFAULT_FEE_RATE, MAX_SAT_PER_TX } from './contract';
import type { OpnetConfig } from '../types';

function getContract(config: OpnetConfig) {
    return getCrowdOracleContract(config.provider, config.network, config.publicKey || undefined);
}

function parseContractError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    // WASM unreachable = contract threw an error (assertion/revert)
    if (msg.includes('unreachable')) {
        return 'Contract execution failed. This oracle may not exist on-chain yet — create it via the Create page first.';
    }
    if (msg.includes('revert')) {
        return msg;
    }
    if (msg.includes('Error in calling function')) {
        return 'Contract call failed. Make sure the contract is deployed and the oracle exists on-chain.';
    }
    return msg;
}

async function sendTx(config: OpnetConfig, simulation: any): Promise<string> {
    if (!config.signer) throw new Error('Wallet signer not available. Reconnect wallet.');
    if ((simulation as any).revert) throw new Error((simulation as any).revert);
    if ((simulation as any).error) throw new Error((simulation as any).error);
    const tx = await simulation.sendTransaction({
        signer: config.signer,
        refundTo: config.walletAddress,
        maximumAllowedSatToSpend: MAX_SAT_PER_TX,
        feeRate: DEFAULT_FEE_RATE,
        network: config.network,
    } as any);
    return tx?.transactionId || tx?.toString() || 'sent';
}

// ── Write methods ──

export async function createOracleOnChain(
    config: OpnetConfig,
    questionHash: bigint,
    deadlineTimestamp: bigint,
): Promise<string> {
    const c = getContract(config);
    console.log('createOracle params:', { questionHash: questionHash.toString(), deadline: deadlineTimestamp.toString() });
    let sim;
    try {
        sim = await c.createOracle(questionHash, deadlineTimestamp);
    } catch (err) {
        throw new Error(parseContractError(err));
    }
    console.log('createOracle simulation:', JSON.stringify(sim, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
    if ((sim as any).revert) throw new Error((sim as any).revert);
    if ((sim as any).error) throw new Error((sim as any).error);
    const tx = await sendTx(config, sim);
    console.log('createOracle tx:', tx);
    return tx;
}

export async function voteOnChain(
    config: OpnetConfig,
    oracleId: number,
    choice: boolean,
    amountSats: number,
): Promise<string> {
    const c = getContract(config);
    console.log('vote params:', { oracleId, choice, amountSats });
    let sim;
    try {
        sim = await c.vote(
            BigInt(oracleId),
            choice ? BigInt(1) : BigInt(0),
            BigInt(amountSats),
        );
    } catch (err) {
        throw new Error(parseContractError(err));
    }
    console.log('vote simulation:', JSON.stringify(sim, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
    if ((sim as any).revert) throw new Error((sim as any).revert);
    if ((sim as any).error) throw new Error((sim as any).error);
    const tx = await sendTx(config, sim);
    console.log('vote tx:', tx);
    return tx;
}

export async function resolveOracleOnChain(
    config: OpnetConfig,
    oracleId: number,
    result: boolean,
): Promise<string> {
    const c = getContract(config);
    console.log('resolveOracle params:', { oracleId, result });
    let sim;
    try {
        sim = await c.resolveOracle(
            BigInt(oracleId),
            result ? BigInt(1) : BigInt(0),
        );
    } catch (err) {
        throw new Error(parseContractError(err));
    }
    console.log('resolveOracle simulation:', JSON.stringify(sim, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
    if ((sim as any).revert) throw new Error((sim as any).revert);
    if ((sim as any).error) throw new Error((sim as any).error);
    const tx = await sendTx(config, sim);
    console.log('resolveOracle tx:', tx);
    return tx;
}

export async function claimRewardOnChain(
    config: OpnetConfig,
    oracleId: number,
): Promise<string> {
    const c = getContract(config);
    console.log('claimReward params:', { oracleId });
    let sim;
    try {
        sim = await c.claimReward(BigInt(oracleId));
    } catch (err) {
        throw new Error(parseContractError(err));
    }
    console.log('claimReward simulation:', JSON.stringify(sim, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
    if ((sim as any).revert) throw new Error((sim as any).revert);
    if ((sim as any).error) throw new Error((sim as any).error);
    const tx = await sendTx(config, sim);
    console.log('claimReward tx:', tx);
    return tx;
}

// ── Read methods ──

export async function getOracleCountOnChain(config: OpnetConfig): Promise<number> {
    if (!CONTRACT_ADDRESS || !config.provider) return 0;
    try {
        const c = getCrowdOracleContract(config.provider, config.network);
        const r = await c.getOracleCount();
        const p = r?.properties as any;
        return Number(p?.count?.toString() || '0');
    } catch (e) {
        console.warn('getOracleCount failed:', e);
        return 0;
    }
}

export async function getOracleOnChain(
    config: OpnetConfig,
    oracleId: number,
): Promise<{
    questionHash: string;
    deadline: number;
    resolved: boolean;
    result: boolean;
    totalYes: number;
    totalNo: number;
} | null> {
    if (!CONTRACT_ADDRESS || !config.provider) return null;
    try {
        const c = getCrowdOracleContract(config.provider, config.network);
        const r = await c.getOracle(BigInt(oracleId));
        const p = r?.properties as any;
        return {
            questionHash: p?.questionHash?.toString() || '0',
            deadline: Number(p?.deadline?.toString() || '0'),
            resolved: p?.resolved?.toString() === '1',
            result: p?.result?.toString() === '1',
            totalYes: Number(p?.totalYes?.toString() || '0'),
            totalNo: Number(p?.totalNo?.toString() || '0'),
        };
    } catch (e) {
        console.warn('getOracle failed:', e);
        return null;
    }
}

export async function getUserVoteOnChain(
    config: OpnetConfig,
    oracleId: number,
    userAddress: string,
): Promise<{ exists: boolean; choice: boolean; amount: number; claimed: boolean } | null> {
    if (!CONTRACT_ADDRESS || !config.provider) return null;
    try {
        const c = getCrowdOracleContract(config.provider, config.network);
        const r = await c.getUserVote(BigInt(oracleId), userAddress);
        const p = r?.properties as any;
        return {
            exists: p?.exists?.toString() === '1',
            choice: p?.choice?.toString() === '1',
            amount: Number(p?.amount?.toString() || '0'),
            claimed: p?.claimed?.toString() === '1',
        };
    } catch (e) {
        console.warn('getUserVote failed:', e);
        return null;
    }
}
