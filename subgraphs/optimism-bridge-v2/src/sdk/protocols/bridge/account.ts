import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Account as AccountSchema,
  BridgeTransfer,
  CrosschainToken,
  LiquidityDeposit,
  LiquidityWithdraw,
  PoolRoute,
  ActiveAccount,
  BridgeMessage,
} from "../../../../generated/schema";
import { Pool } from "./pool";
import { Bridge } from "./protocol";
import { TokenManager } from "./tokens";
import { BridgePoolType, TransactionType, TransferType } from "./enums";
import { getUnixDays, getUnixHours } from "../../util/events";
import { CustomEventType } from "../../util/events";

export class AccountManager {
  protocol: Bridge;
  tokens: TokenManager;

  constructor(protocol: Bridge, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadAccount(address: Address): Account {
    let acc = AccountSchema.load(address);
    if (acc) {
      return new Account(this.protocol, acc, this.tokens);
    }

    acc = new AccountSchema(address);
    acc.chains = [];
    acc.transferOutCount = 0;
    acc.transferInCount = 0;
    acc.depositCount = 0;
    acc.withdrawCount = 0;
    acc.messageSentCount = 0;
    acc.messageReceivedCount = 0;
    acc.save();

    this.protocol.addUser();

    return new Account(this.protocol, acc, this.tokens);
  }
}

namespace ActivityType {
  export const TRANSFER_OUT = "transferOut";
  export const TRANSFER_IN = "transferIn";
  export const LIQUIDITY_PROVISIONING = "liquidity";
  export const MESSAGE = "message";
}
type ActivityType = string;

export class AccountWasActive {
  hourly: boolean;
  daily: boolean;
}

export class Account {
  account: AccountSchema;
  event: CustomEventType;
  protocol: Bridge;
  tokens: TokenManager;

  /**
   * Tracks the number of event entities created by this account during the current ethereum.Event
   * in case multiple ones need to be created at once, to avoid ID collissions.
   */
  private eventCount: u8;

  constructor(protocol: Bridge, account: AccountSchema, tokens: TokenManager) {
    this.account = account;
    this.protocol = protocol;
    this.event = protocol.getCurrentEvent();
    this.tokens = tokens;
    this.eventCount = 0;
  }

  private isActiveByActivityID(id: string): boolean {
    const _id = Bytes.fromUTF8(id);
    const dAct = ActiveAccount.load(_id);
    if (!dAct) {
      new ActiveAccount(_id).save();
      return true;
    }
    return false;
  }

  private trackActivity(activityType: ActivityType): void {
    const days = getUnixDays(this.event.block);
    const hours = getUnixHours(this.event.block);

    const generalHourlyID = `${this.account.id.toHexString()}-hourly-${hours}`;
    const generalDailyID = `${this.account.id.toHexString()}-daily-${days}`;
    const typeHourlyID = `${this.account.id.toHexString()}-hourly-${hours}-${activityType}`;
    const typeDailyID = `${this.account.id.toHexString()}-daily-${days}-${activityType}`;

    const tHourly = this.isActiveByActivityID(typeHourlyID);
    const tDaily = this.isActiveByActivityID(typeDailyID);
    const gHourly = this.isActiveByActivityID(generalHourlyID);
    const gDaily = this.isActiveByActivityID(generalDailyID);

    const generalActivity: AccountWasActive = {
      daily: gDaily,
      hourly: gHourly,
    };
    const typeActivity: AccountWasActive = {
      daily: tDaily,
      hourly: tHourly,
    };

    if (activityType == ActivityType.TRANSFER_IN) {
      this.protocol.addActiveTransferReceiver(typeActivity);
    } else if (activityType == ActivityType.TRANSFER_OUT) {
      this.protocol.addActiveTransferSender(typeActivity);
    } else if (activityType == ActivityType.MESSAGE) {
      this.protocol.addActiveMessageSender(typeActivity);
    } else if (activityType == ActivityType.LIQUIDITY_PROVISIONING) {
      this.protocol.addActiveLiquidityProvider(typeActivity);
    }
    this.protocol.addActiveUser(generalActivity);
  }

  /**
   * Adds a chain to the account's list of chains it has bridged funds to/from.
   * This call is idempotent, if a chain is already there it won't be added again.
   * You don't need to call this if you're using the transferIn or transferOut methods.
   *
   * @param chain chainID of a chain this account has sent funds from or to.
   */
  addChain(chain: BigInt): void {
    if (this.account.chains.includes(chain)) {
      return;
    }

    const chains = this.account.chains;
    chains.push(chain);
    this.account.chains = chains;
    this.account.save();
  }

  /**
   * Creates a BridgeTransfer entity for a transfer away from this chain
   * to a non-EVM chain and updates the volumes at PoolRoute, Pool and Protocol.
   *
   * @param pool The pool the transfer was made on.
   * @param route The route the transfer went through.
   * @param destination The non-EVM account receiving the funds.
   * @param amount The amount of tokens transferred.
   * @param transactionID Optional transaction ID on the source chain.
   * @param updateMetrics Optional, defaults to true. If true, volumes will be updated at PoolRoute, Pool and Protocol. Make it false if you want to update these manually for some reason. Activity counts and transaction counts will still be updated.
   * @returns BridgeTransfer
   */
  nonEVMTransferOut(
    pool: Pool,
    route: PoolRoute,
    destination: Bytes,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferOut();
    return this.transfer(
      pool,
      route,
      destination,
      amount,
      true,
      transactionID,
      updateMetrics
    );
  }

  /**
   * Creates a BridgeTransfer entity for a transfer away from this chain
   * and updates the volumes at PoolRoute, Pool and Protocol.
   *
   * @param pool The pool the transfer was made on.
   * @param route The route the transfer went through.
   * @param destination The account receiving the funds.
   * @param amount The amount of tokens transferred.
   * @param transactionID Optional transaction ID on the source chain.
   * @param updateMetrics Optional, defaults to true. If true, volumes will be updated at PoolRoute, Pool and Protocol. Make it false if you want to update these manually for some reason. Activity counts and transaction counts will still be updated.
   * @returns BridgeTransfer
   */
  transferOut(
    pool: Pool,
    route: PoolRoute,
    destination: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferOut();
    return this.transfer(
      pool,
      route,
      destination,
      amount,
      true,
      transactionID,
      updateMetrics
    );
  }

  /**
   * Creates a BridgeTransfer entity for a transfer arriving to this chain
   * from a non-EVM address and updates the volumes at PoolRoute, Pool and Protocol.
   *
   * @param pool The pool the transfer was made on.
   * @param route The route the transfer went through.
   * @param source The non-EVM account sending the funds.
   * @param amount The amount of tokens transferred.
   * @param transactionID Optional transaction ID on the source chain.
   * @param updateMetrics Optional, defaults to true. If true, volumes will be updated at PoolRoute, Pool and Protocol. Make it false if you want to update these manually for some reason. Activity counts and transaction counts will still be updated.
   * @returns BridgeTransfer
   */
  nonEVMTransferIn(
    pool: Pool,
    route: PoolRoute,
    source: Bytes,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferIn();
    return this.transfer(
      pool,
      route,
      source,
      amount,
      false,
      transactionID,
      updateMetrics
    );
  }

  /**
   * Creates a BridgeTransfer entity for a transfer arriving to this chain
   * and updates the volumes at PoolRoute, Pool and Protocol.
   *
   * @param pool The pool the transfer was made on.
   * @param route The route the transfer went through.
   * @param source The account sending the funds.
   * @param amount The amount of tokens transferred.
   * @param transactionID Optional transaction ID on the source chain.
   * @param updateMetrics Optional, defaults to true. If true, volumes will be updated at PoolRoute, Pool and Protocol. Make it false if you want to update these manually for some reason. Activity counts and transaction counts will still be updated.
   * @returns BridgeTransfer
   */
  transferIn(
    pool: Pool,
    route: PoolRoute,
    source: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferIn();
    return this.transfer(
      pool,
      route,
      source,
      amount,
      false,
      transactionID,
      updateMetrics
    );
  }

  private transfer(
    pool: Pool,
    route: PoolRoute,
    counterparty: Bytes,
    amount: BigInt,
    isOutgoing: boolean,
    transactionID: Bytes | null,
    updateMetrics: boolean
  ): BridgeTransfer {
    const _pool = pool.pool;
    const token = this.tokens.getOrCreateToken(
      Address.fromBytes(_pool.inputToken)
    );
    const crossToken = CrosschainToken.load(route.crossToken)!;

    const transfer = this.transferBoilerplate();
    transfer.isOutgoing = isOutgoing;
    transfer.to = isOutgoing ? pool.getBytesID() : this.account.id;
    transfer.from = isOutgoing ? this.account.id : pool.getBytesID();
    transfer.fromChainID = isOutgoing
      ? this.protocol.getCurrentChainID()
      : crossToken.chainID;
    transfer.toChainID = isOutgoing
      ? crossToken.chainID
      : this.protocol.getCurrentChainID();
    transfer.transferTo = isOutgoing ? counterparty : this.account.id;
    transfer.transferFrom = isOutgoing ? this.account.id : counterparty;
    transfer.type = inferTransferType(_pool.type, isOutgoing);
    transfer.pool = pool.getBytesID();
    transfer.route = route.id;
    transfer.token = route.inputToken;
    transfer.amount = amount;
    transfer.amountUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    transfer.crosschainToken = crossToken.id;
    transfer.isSwap = route.isSwap;
    transfer.crossTransactionID = transactionID;
    transfer.save();

    this.addChain(transfer.fromChainID);
    this.addChain(transfer.toChainID);
    if (!updateMetrics) {
      return transfer;
    }

    pool.trackTransfer(
      transfer,
      route,
      isOutgoing ? TransactionType.TRANSFER_OUT : TransactionType.TRANSFER_IN
    );
    return transfer;
  }

  private transferBoilerplate(): BridgeTransfer {
    const id = this.idFromEvent(this.event);
    const transfer = new BridgeTransfer(id);
    transfer.hash = this.event.transaction.hash;
    transfer.logIndex = this.event.logIndex.toI32();
    transfer.blockNumber = this.event.block.number;
    transfer.timestamp = this.event.block.timestamp;

    transfer.protocol = this.protocol.getBytesID();
    transfer.account = this.account.id;

    return transfer;
  }

  /**
   * Creates a BridgeMessage entity for a message arriving to this chain
   *
   * @param srcChainId the source chain id
   * @param source The account sending the message.
   * @param data Contents of the message
   * @param transactionID Optional transaction ID on the source chain.
   * @returns BridgeMessage
   */
  messageIn(srcChainId: BigInt, source: Address, data: Bytes): BridgeMessage {
    this.countMessageIn();
    this.protocol.addTransaction(TransactionType.MESSAGE_RECEIVED);

    return this.message(
      srcChainId,
      this.protocol.getCurrentChainID(),
      source,
      Address.fromBytes(this.account.id),
      false,
      data
    );
  }

  /**
   * Creates a BridgeMessage entity for a message away from this chain
   *
   * @param dstChainId the destination chain id
   * @param destination The account receiving the message.
   * @param data Contents of the message
   * @returns BridgeMessage
   */
  messageOut(
    dstChainId: BigInt,
    destination: Address,
    data: Bytes
  ): BridgeMessage {
    this.countMessageOut();
    this.protocol.addTransaction(TransactionType.MESSAGE_SENT);

    return this.message(
      this.protocol.getCurrentChainID(),
      dstChainId,
      Address.fromBytes(this.account.id),
      destination,
      true,
      data
    );
  }

  private message(
    srcChainId: BigInt,
    dstChainId: BigInt,
    sender: Address,
    receiver: Address,
    isOutgoing: boolean,
    data: Bytes
  ): BridgeMessage {
    const id = this.idFromEvent(this.event);
    const message = new BridgeMessage(id);
    message.hash = this.event.transaction.hash;
    message.logIndex = this.event.logIndex.toI32();
    message.blockNumber = this.event.block.number;
    message.timestamp = this.event.block.timestamp;

    message.protocol = this.protocol.getBytesID();
    message.account = this.account.id;
    message.from = sender;
    message.to = receiver;
    message.isOutgoing = isOutgoing;
    message.data = data;
    message.fromChainID = srcChainId;
    message.toChainID = dstChainId;
    message.save();

    return message;
  }

  /**
   *
   * @param pool The pool where the liquidity was deposited.
   * @param amount The amount deposited of inputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns LiquidityDeposit
   */
  liquidityDeposit(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityDeposit {
    const _pool = pool.pool;
    const token = this.tokens.getOrCreateToken(
      Address.fromBytes(_pool.inputToken)
    );

    const id = this.idFromEvent(this.event);
    const deposit = new LiquidityDeposit(id);
    deposit.hash = this.event.transaction.hash;
    deposit.logIndex = this.event.logIndex.toI32();
    deposit.blockNumber = this.event.block.number;
    deposit.timestamp = this.event.block.timestamp;
    deposit.protocol = this.protocol.getBytesID();
    deposit.account = this.account.id;

    deposit.to = pool.getBytesID();
    deposit.from = this.account.id;
    deposit.pool = pool.getBytesID();
    deposit.token = _pool.inputToken;
    deposit.amount = amount;
    deposit.amountUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    deposit.chainID = this.protocol.getCurrentChainID();
    deposit.save();

    this.countDeposit();
    if (updateMetrics) {
      pool.trackDeposit(deposit);
    }
    return deposit;
  }

  /**
   *
   * @param pool The pool where the liquidity was deposited.
   * @param amount The amount deposited of inputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns LiquidityWithdraw
   */
  liquidityWithdraw(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityWithdraw {
    const _pool = pool.pool;
    const token = this.tokens.getOrCreateToken(
      Address.fromBytes(_pool.inputToken)
    );

    const id = this.idFromEvent(this.event);
    const withdraw = new LiquidityWithdraw(id);
    withdraw.hash = this.event.transaction.hash;
    withdraw.logIndex = this.event.logIndex.toI32();
    withdraw.blockNumber = this.event.block.number;
    withdraw.timestamp = this.event.block.timestamp;
    withdraw.protocol = this.protocol.getBytesID();
    withdraw.account = this.account.id;

    withdraw.from = pool.getBytesID();
    withdraw.to = this.account.id;
    withdraw.pool = pool.getBytesID();
    withdraw.token = _pool.inputToken;
    withdraw.amount = amount;
    withdraw.amountUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    withdraw.chainID = this.protocol.getCurrentChainID();
    withdraw.save();

    this.countWithdraw();
    if (updateMetrics) {
      pool.trackWithdraw(withdraw);
    }
    return withdraw;
  }

  /**
   * Adds 1 to the account total deposit count. If it is the first deposit ever
   * and the account has not withdrawn before it will also increase
   * the number of liquidity providers in the protocol.
   */
  countDeposit(): void {
    if (this.account.depositCount == 0 && this.account.withdrawCount == 0) {
      this.protocol.addLiquidityProvider();
    }
    this.trackActivity(ActivityType.LIQUIDITY_PROVISIONING);
    this.account.depositCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total withdraw count. If it is the first withdraw ever
   * and the account has not deposited before it will also increase the number of liquidity providers in the protocol.
   */
  countWithdraw(): void {
    if (this.account.depositCount == 0 && this.account.withdrawCount == 0) {
      this.protocol.addLiquidityProvider();
    }
    this.trackActivity(ActivityType.LIQUIDITY_PROVISIONING);
    this.account.withdrawCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total transferIn count. If it is the first transfer received ever
   * by this account it will also increase the number of transfer receivers in the protocol.
   */
  countTransferIn(): void {
    if (this.account.transferInCount == 0) {
      this.protocol.addTransferReceiver();
    }
    this.trackActivity(ActivityType.TRANSFER_IN);
    this.account.transferInCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total transferOut count. If it is the first transfer sent ever
   * by this account it will also increase the number of transfer senders in the protocol.
   */
  countTransferOut(): void {
    if (this.account.transferOutCount == 0) {
      this.protocol.addTransferSender();
    }
    this.trackActivity(ActivityType.TRANSFER_OUT);
    this.account.transferOutCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total MessageReceived count. (not yet ) If it is the first message received ever
   * by this account it will also increase the number of unique message receivers in the protocol.
   */
  countMessageIn(): void {
    /*
    // enable this if it is necessary to track message receivers
    if (this.account.messageReceivedCount == 0) {
      this.protocol.addMessageReceiver();
    }
    */
    this.trackActivity(ActivityType.MESSAGE);
    this.account.messageReceivedCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total MessageSent count. If it is the first message sent ever
   * by this account it will also increase the number of unique message senders in the protocol.
   */
  countMessageOut(): void {
    if (this.account.messageSentCount == 0) {
      this.protocol.addMessageSender();
    }
    this.trackActivity(ActivityType.MESSAGE);
    this.account.messageSentCount += 1;
    this.account.save();
  }

  idFromEvent(event: CustomEventType): Bytes {
    this.eventCount += 1;
    return event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concatI32(this.eventCount);
  }
}

function inferTransferType(
  poolType: BridgePoolType,
  isOutgoing: boolean
): TransferType {
  if (poolType == BridgePoolType.LOCK_RELEASE) {
    return isOutgoing ? TransferType.LOCK : TransferType.RELEASE;
  }
  if (poolType == BridgePoolType.BURN_MINT) {
    return isOutgoing ? TransferType.BURN : TransferType.MINT;
  }
  if (poolType == BridgePoolType.LIQUIDITY) {
    return isOutgoing ? TransferType.LOCK : TransferType.RELEASE;
  }

  log.error("Unknown pool type at inferTransferType {}", [poolType]);
  log.critical("", []);
  return "UNKNOWN";
}
