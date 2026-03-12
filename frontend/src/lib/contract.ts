import {
    getContract,
    ABIDataTypes,
    BitcoinAbiTypes,
} from 'opnet';
import type { BaseContractProperties, BitcoinInterfaceAbi } from 'opnet';
import { Address } from '@btc-vision/transaction';

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const DEFAULT_FEE_RATE = 10;
export const MAX_SAT_PER_TX = BigInt(100_000);

const ABI: BitcoinInterfaceAbi = [
    // ── Write methods ──
    {
        name: 'createOracle',
        type: BitcoinAbiTypes.Function,
        inputs: [
            { name: 'questionHash', type: ABIDataTypes.UINT256 },
            { name: 'deadline', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'oracleId', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'vote',
        type: BitcoinAbiTypes.Function,
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'choice', type: ABIDataTypes.UINT256 },
            { name: 'amount', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'resolveOracle',
        type: BitcoinAbiTypes.Function,
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'result', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'result', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'claimReward',
        type: BitcoinAbiTypes.Function,
        inputs: [{ name: 'oracleId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'reward', type: ABIDataTypes.UINT256 }],
    },
    // ── Read methods ──
    {
        name: 'getOracleCount',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'getOracle',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [{ name: 'oracleId', type: ABIDataTypes.UINT256 }],
        outputs: [
            { name: 'questionHash', type: ABIDataTypes.UINT256 },
            { name: 'deadline', type: ABIDataTypes.UINT256 },
            { name: 'resolved', type: ABIDataTypes.UINT256 },
            { name: 'result', type: ABIDataTypes.UINT256 },
            { name: 'totalYes', type: ABIDataTypes.UINT256 },
            { name: 'totalNo', type: ABIDataTypes.UINT256 },
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'getUserVote',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'user', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [
            { name: 'exists', type: ABIDataTypes.UINT256 },
            { name: 'choice', type: ABIDataTypes.UINT256 },
            { name: 'amount', type: ABIDataTypes.UINT256 },
            { name: 'claimed', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'getUserClaimed',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'user', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'claimed', type: ABIDataTypes.UINT256 }],
    },
];

export interface ICrowdOracleContract extends BaseContractProperties {
    createOracle(questionHash: bigint, deadline: bigint): Promise<any>;
    vote(oracleId: bigint, choice: bigint, amount: bigint): Promise<any>;
    resolveOracle(oracleId: bigint, result: bigint): Promise<any>;
    claimReward(oracleId: bigint): Promise<any>;
    getOracleCount(): Promise<any>;
    getOracle(oracleId: bigint): Promise<any>;
    getUserVote(oracleId: bigint, user: string): Promise<any>;
    getUserClaimed(oracleId: bigint, user: string): Promise<any>;
}

export function getCrowdOracleContract(
    provider: any,
    network: any,
    senderPubKey?: string,
): ICrowdOracleContract {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env');
    }

    let senderAddress: Address | undefined;
    if (senderPubKey) {
        try {
            senderAddress = Address.fromString(senderPubKey);
        } catch {
            senderAddress = undefined;
        }
    }

    return getContract<ICrowdOracleContract>(
        CONTRACT_ADDRESS,
        ABI,
        provider,
        network,
        senderAddress,
    );
}
