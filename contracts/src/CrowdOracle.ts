import {
  OP_NET,
  Blockchain,
  BytesWriter,
  Calldata,
  Address,
  StoredU256,
  Revert,
  EMPTY_POINTER,
} from '@btc-vision/btc-runtime/runtime';
import { sha256 } from '@btc-vision/btc-runtime/runtime/env/global';
import { u256 } from '@btc-vision/as-bignum/assembly';

@final
export class CrowdOracle extends OP_NET {
  // =================== STORAGE POINTERS ===================
  // Order matters — must be consistent across deploys
  private _oracleCountPointer: u16 = Blockchain.nextPointer;
  private _oracleCreatorBasePointer: u16 = Blockchain.nextPointer;
  private _oracleDeadlineBasePointer: u16 = Blockchain.nextPointer;
  private _oracleResolvedBasePointer: u16 = Blockchain.nextPointer;
  private _oracleResultBasePointer: u16 = Blockchain.nextPointer;
  private _oracleTotalYesBasePointer: u16 = Blockchain.nextPointer;
  private _oracleTotalNoBasePointer: u16 = Blockchain.nextPointer;
  private _oracleQuestionHashBasePointer: u16 = Blockchain.nextPointer;
  private _voteChoiceBasePointer: u16 = Blockchain.nextPointer;
  private _voteAmountBasePointer: u16 = Blockchain.nextPointer;
  private _voteClaimedBasePointer: u16 = Blockchain.nextPointer;
  private _voteExistsBasePointer: u16 = Blockchain.nextPointer;

  private _oracleCount: StoredU256 = new StoredU256(this._oracleCountPointer, EMPTY_POINTER);

  // =================== HELPERS ===================
  // StoredU256 requires subPointer to be EXACTLY 30 bytes (encodePointer enforce30Bytes)

  private _subPointerForOracle(oracleId: u256): Uint8Array {
    // u256 is 32 bytes big-endian; take last 30 bytes (skip 2 high bytes)
    // Safe for oracle IDs < 2^240 (practically unlimited)
    const writer = new BytesWriter(32);
    writer.writeU256(oracleId);
    const full = writer.getBuffer();
    const result = new Uint8Array(30);
    for (let i: i32 = 0; i < 30; i++) {
      result[i] = full[i + 2];
    }
    return result;
  }

  private _subPointerForUserOracle(oracleId: u256, user: Address): Uint8Array {
    // Hash (oracleId || address) with sha256 → take first 30 bytes
    const writer = new BytesWriter(64);
    writer.writeU256(oracleId);
    writer.writeAddress(user);
    const hash = sha256(writer.getBuffer());
    const result = new Uint8Array(30);
    for (let i: i32 = 0; i < 30; i++) {
      result[i] = hash[i];
    }
    return result;
  }

  // =================== CREATE ORACLE ===================
  @method(
    { name: 'questionHash', type: ABIDataTypes.UINT256 },
    { name: 'deadline', type: ABIDataTypes.UINT256 },
  )
  @returns({ name: 'oracleId', type: ABIDataTypes.UINT256 })
  public createOracle(calldata: Calldata): BytesWriter {
    const questionHash: u256 = calldata.readU256();
    const deadline: u256 = calldata.readU256();

    const sender = Blockchain.tx.sender;
    const oracleId = this._oracleCount.value;
    const subPtr = this._subPointerForOracle(oracleId);

    // Store oracle creator as u256
    const creatorStorage = new StoredU256(this._oracleCreatorBasePointer, subPtr);
    const senderWriter = new BytesWriter(32);
    senderWriter.writeAddress(sender);
    creatorStorage.value = u256.fromUint8ArrayBE(senderWriter.getBuffer());

    const deadlineStorage = new StoredU256(this._oracleDeadlineBasePointer, subPtr);
    deadlineStorage.value = deadline;

    const resolvedStorage = new StoredU256(this._oracleResolvedBasePointer, subPtr);
    resolvedStorage.value = u256.Zero;

    const resultStorage = new StoredU256(this._oracleResultBasePointer, subPtr);
    resultStorage.value = u256.Zero;

    const totalYesStorage = new StoredU256(this._oracleTotalYesBasePointer, subPtr);
    totalYesStorage.value = u256.Zero;

    const totalNoStorage = new StoredU256(this._oracleTotalNoBasePointer, subPtr);
    totalNoStorage.value = u256.Zero;

    const questionStorage = new StoredU256(this._oracleQuestionHashBasePointer, subPtr);
    questionStorage.value = questionHash;

    // Increment oracle count
    this._oracleCount.value = u256.add(oracleId, u256.One);

    const writer = new BytesWriter(32);
    writer.writeU256(oracleId);
    return writer;
  }

  // =================== VOTE ===================
  @method(
    { name: 'oracleId', type: ABIDataTypes.UINT256 },
    { name: 'choice', type: ABIDataTypes.UINT256 },
    { name: 'amount', type: ABIDataTypes.UINT256 },
  )
  @returns({ name: 'staked', type: ABIDataTypes.UINT256 })
  public vote(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();
    const choice: u256 = calldata.readU256(); // 0 = NO, 1 = YES
    const amount: u256 = calldata.readU256(); // stake amount

    // Validate oracle exists
    const count = this._oracleCount.value;
    if (u256.ge(oracleId, count)) {
      throw new Revert('Oracle does not exist');
    }

    // Validate amount > 0
    if (u256.eq(amount, u256.Zero)) {
      throw new Revert('Stake amount must be > 0');
    }

    // Validate choice is 0 or 1
    if (u256.gt(choice, u256.One)) {
      throw new Revert('Choice must be 0 (NO) or 1 (YES)');
    }

    const subPtr = this._subPointerForOracle(oracleId);

    // Check not resolved
    const resolved = new StoredU256(this._oracleResolvedBasePointer, subPtr).value;
    if (u256.eq(resolved, u256.One)) {
      throw new Revert('Oracle already resolved');
    }

    const sender = Blockchain.tx.sender;
    const userSubPtr = this._subPointerForUserOracle(oracleId, sender);

    // Check user hasn't voted
    const existsStorage = new StoredU256(this._voteExistsBasePointer, userSubPtr);
    if (u256.eq(existsStorage.value, u256.One)) {
      throw new Revert('Already voted');
    }

    // Record vote
    existsStorage.value = u256.One;

    const choiceStorage = new StoredU256(this._voteChoiceBasePointer, userSubPtr);
    choiceStorage.value = choice;

    const amountStorage = new StoredU256(this._voteAmountBasePointer, userSubPtr);
    amountStorage.value = amount;

    const claimedStorage = new StoredU256(this._voteClaimedBasePointer, userSubPtr);
    claimedStorage.value = u256.Zero;

    // Update pool totals
    if (u256.eq(choice, u256.One)) {
      const totalYes = new StoredU256(this._oracleTotalYesBasePointer, subPtr);
      totalYes.value = u256.add(totalYes.value, amount);
    } else {
      const totalNo = new StoredU256(this._oracleTotalNoBasePointer, subPtr);
      totalNo.value = u256.add(totalNo.value, amount);
    }

    const writer = new BytesWriter(32);
    writer.writeU256(amount);
    return writer;
  }

  // =================== RESOLVE ORACLE ===================
  @method(
    { name: 'oracleId', type: ABIDataTypes.UINT256 },
    { name: 'result', type: ABIDataTypes.UINT256 },
  )
  @returns({ name: 'outcome', type: ABIDataTypes.UINT256 })
  public resolveOracle(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();
    const result: u256 = calldata.readU256(); // 0 = NO wins, 1 = YES wins

    // Validate oracle exists
    const count = this._oracleCount.value;
    if (u256.ge(oracleId, count)) {
      throw new Revert('Oracle does not exist');
    }

    if (u256.gt(result, u256.One)) {
      throw new Revert('Result must be 0 (NO) or 1 (YES)');
    }

    const subPtr = this._subPointerForOracle(oracleId);

    // Check not already resolved
    const resolvedStorage = new StoredU256(this._oracleResolvedBasePointer, subPtr);
    if (u256.eq(resolvedStorage.value, u256.One)) {
      throw new Revert('Already resolved');
    }

    // Mark as resolved
    resolvedStorage.value = u256.One;

    const resultStorage = new StoredU256(this._oracleResultBasePointer, subPtr);
    resultStorage.value = result;

    const writer = new BytesWriter(32);
    writer.writeU256(result);
    return writer;
  }

  // =================== CLAIM REWARD ===================
  @method({ name: 'oracleId', type: ABIDataTypes.UINT256 })
  @returns({ name: 'reward', type: ABIDataTypes.UINT256 })
  public claimReward(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();

    // Validate oracle exists
    const count = this._oracleCount.value;
    if (u256.ge(oracleId, count)) {
      throw new Revert('Oracle does not exist');
    }

    const subPtr = this._subPointerForOracle(oracleId);

    // Check oracle is resolved
    const resolved = new StoredU256(this._oracleResolvedBasePointer, subPtr).value;
    if (!u256.eq(resolved, u256.One)) {
      throw new Revert('Oracle not resolved yet');
    }

    const sender = Blockchain.tx.sender;
    const userSubPtr = this._subPointerForUserOracle(oracleId, sender);

    // Check user voted
    const exists = new StoredU256(this._voteExistsBasePointer, userSubPtr).value;
    if (!u256.eq(exists, u256.One)) {
      throw new Revert('You did not vote');
    }

    // Check not already claimed
    const claimedStorage = new StoredU256(this._voteClaimedBasePointer, userSubPtr);
    if (u256.eq(claimedStorage.value, u256.One)) {
      throw new Revert('Already claimed');
    }

    // Check user voted for winning side
    const resultVal = new StoredU256(this._oracleResultBasePointer, subPtr).value;
    const userChoice = new StoredU256(this._voteChoiceBasePointer, userSubPtr).value;

    if (!u256.eq(userChoice, resultVal)) {
      throw new Revert('You voted for the losing side');
    }

    // Calculate reward: reward = userStake * totalPool / winningPool
    const totalYes = new StoredU256(this._oracleTotalYesBasePointer, subPtr).value;
    const totalNo = new StoredU256(this._oracleTotalNoBasePointer, subPtr).value;
    const totalPool = u256.add(totalYes, totalNo);

    const winningPool = u256.eq(resultVal, u256.One) ? totalYes : totalNo;
    const userAmount = new StoredU256(this._voteAmountBasePointer, userSubPtr).value;

    let reward: u256;
    if (u256.eq(winningPool, u256.Zero)) {
      reward = u256.Zero;
    } else {
      reward = u256.div(u256.mul(userAmount, totalPool), winningPool);
    }

    // Mark as claimed
    claimedStorage.value = u256.One;

    const writer = new BytesWriter(32);
    writer.writeU256(reward);
    return writer;
  }

  // =================== VIEW: GET ORACLE COUNT ===================
  @method()
  @returns({ name: 'count', type: ABIDataTypes.UINT256 })
  public getOracleCount(calldata: Calldata): BytesWriter {
    const writer = new BytesWriter(32);
    writer.writeU256(this._oracleCount.value);
    return writer;
  }

  // =================== VIEW: GET ORACLE ===================
  @method({ name: 'oracleId', type: ABIDataTypes.UINT256 })
  @returns(
    { name: 'questionHash', type: ABIDataTypes.UINT256 },
    { name: 'deadline', type: ABIDataTypes.UINT256 },
    { name: 'resolved', type: ABIDataTypes.UINT256 },
    { name: 'result', type: ABIDataTypes.UINT256 },
    { name: 'totalYes', type: ABIDataTypes.UINT256 },
    { name: 'totalNo', type: ABIDataTypes.UINT256 },
    { name: 'oracleId', type: ABIDataTypes.UINT256 },
  )
  public getOracle(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();
    const count = this._oracleCount.value;
    if (u256.ge(oracleId, count)) {
      throw new Revert('Oracle does not exist');
    }

    const subPtr = this._subPointerForOracle(oracleId);

    const questionHash = new StoredU256(this._oracleQuestionHashBasePointer, subPtr).value;
    const deadline = new StoredU256(this._oracleDeadlineBasePointer, subPtr).value;
    const resolved = new StoredU256(this._oracleResolvedBasePointer, subPtr).value;
    const result = new StoredU256(this._oracleResultBasePointer, subPtr).value;
    const totalYes = new StoredU256(this._oracleTotalYesBasePointer, subPtr).value;
    const totalNo = new StoredU256(this._oracleTotalNoBasePointer, subPtr).value;

    const writer = new BytesWriter(224);
    writer.writeU256(questionHash);
    writer.writeU256(deadline);
    writer.writeU256(resolved);
    writer.writeU256(result);
    writer.writeU256(totalYes);
    writer.writeU256(totalNo);
    writer.writeU256(oracleId);
    return writer;
  }

  // =================== VIEW: GET USER VOTE ===================
  @method(
    { name: 'oracleId', type: ABIDataTypes.UINT256 },
    { name: 'user', type: ABIDataTypes.ADDRESS },
  )
  @returns(
    { name: 'exists', type: ABIDataTypes.UINT256 },
    { name: 'choice', type: ABIDataTypes.UINT256 },
    { name: 'amount', type: ABIDataTypes.UINT256 },
    { name: 'claimed', type: ABIDataTypes.UINT256 },
  )
  public getUserVote(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();
    const user: Address = calldata.readAddress();

    const userSubPtr = this._subPointerForUserOracle(oracleId, user);

    const exists = new StoredU256(this._voteExistsBasePointer, userSubPtr).value;
    const choice = new StoredU256(this._voteChoiceBasePointer, userSubPtr).value;
    const amount = new StoredU256(this._voteAmountBasePointer, userSubPtr).value;
    const claimed = new StoredU256(this._voteClaimedBasePointer, userSubPtr).value;

    const writer = new BytesWriter(128);
    writer.writeU256(exists);
    writer.writeU256(choice);
    writer.writeU256(amount);
    writer.writeU256(claimed);
    return writer;
  }

  // =================== VIEW: GET USER CLAIMED ===================
  @method(
    { name: 'oracleId', type: ABIDataTypes.UINT256 },
    { name: 'user', type: ABIDataTypes.ADDRESS },
  )
  @returns({ name: 'claimed', type: ABIDataTypes.UINT256 })
  public getUserClaimed(calldata: Calldata): BytesWriter {
    const oracleId: u256 = calldata.readU256();
    const user: Address = calldata.readAddress();

    const userSubPtr = this._subPointerForUserOracle(oracleId, user);
    const claimed = new StoredU256(this._voteClaimedBasePointer, userSubPtr).value;

    const writer = new BytesWriter(32);
    writer.writeU256(claimed);
    return writer;
  }
}
