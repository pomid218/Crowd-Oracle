import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the createOracle function call.
 */
export type CreateOracle = CallResult<
    {
        oracleId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the vote function call.
 */
export type Vote = CallResult<
    {
        staked: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the resolveOracle function call.
 */
export type ResolveOracle = CallResult<
    {
        outcome: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the claimReward function call.
 */
export type ClaimReward = CallResult<
    {
        reward: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getOracleCount function call.
 */
export type GetOracleCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getOracle function call.
 */
export type GetOracle = CallResult<
    {
        questionHash: bigint;
        deadline: bigint;
        resolved: bigint;
        result: bigint;
        totalYes: bigint;
        totalNo: bigint;
        oracleId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getUserVote function call.
 */
export type GetUserVote = CallResult<
    {
        exists: bigint;
        choice: bigint;
        amount: bigint;
        claimed: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getUserClaimed function call.
 */
export type GetUserClaimed = CallResult<
    {
        claimed: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// ICrowdOracle
// ------------------------------------------------------------------
export interface ICrowdOracle extends IOP_NETContract {
    createOracle(questionHash: bigint, deadline: bigint): Promise<CreateOracle>;
    vote(oracleId: bigint, choice: bigint, amount: bigint): Promise<Vote>;
    resolveOracle(oracleId: bigint, result: bigint): Promise<ResolveOracle>;
    claimReward(oracleId: bigint): Promise<ClaimReward>;
    getOracleCount(): Promise<GetOracleCount>;
    getOracle(oracleId: bigint): Promise<GetOracle>;
    getUserVote(oracleId: bigint, user: Address): Promise<GetUserVote>;
    getUserClaimed(oracleId: bigint, user: Address): Promise<GetUserClaimed>;
}
