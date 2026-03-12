import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const CrowdOracleEvents = [];

export const CrowdOracleAbi = [
    {
        name: 'createOracle',
        inputs: [
            { name: 'questionHash', type: ABIDataTypes.UINT256 },
            { name: 'deadline', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'oracleId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'vote',
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'choice', type: ABIDataTypes.UINT256 },
            { name: 'amount', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'staked', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'resolveOracle',
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'result', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'outcome', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'claimReward',
        inputs: [{ name: 'oracleId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'reward', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getOracleCount',
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getOracle',
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
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getUserVote',
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
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getUserClaimed',
        inputs: [
            { name: 'oracleId', type: ABIDataTypes.UINT256 },
            { name: 'user', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'claimed', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    ...CrowdOracleEvents,
    ...OP_NET_ABI,
];

export default CrowdOracleAbi;
