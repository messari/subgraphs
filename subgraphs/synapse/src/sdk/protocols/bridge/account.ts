import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Account as AccountSchema,
  BridgeTransfer,
  CrosschainToken,
  LiquidityDeposit,
  LiquidityWithdraw,
  PoolRoute,
  ActiveAccount,
} from "../../../../generated/schema";
import { Pool } from "./pool";
import { Bridge } from "./protocol";
import { Tokens } from "./tokens";
import { BridgePoolType, TransactionType, TransferType } from "./constants";
import { getUnixDays, getUnixHours } from "../../util/events";

export class AccountManager {
  protocol: Bridge;

  constructor(protocol: Bridge) {
    this.protocol = protocol;
  }

  loadAccount(address: Address): Account {
    let acc = AccountSchema.load(address);
    if (acc) {
      return new Account(this.protocol, acc);
    }

    acc = new AccountSchema(address);
    acc.chains = [];
    acc.transferOutCount = 0;
    acc.transferInCount = 0;
    acc.depositCount = 0;
    acc.withdrawCount = 0;
    acc.messageCount = 0;
    acc.save();

    return new Account(this.protocol, acc);
  }
}

namespace ActivityType {
  export const TRANSFER_OUT = "transferOut";
  export const TRANSFER_IN = "transferIn";
  export const LIQUIDITY_PROVISIONING = "deposit";
  export const MESSAGE = "message";
}
type ActivityType = string;

export class AccountWasActive {
  hourly: boolean;
  daily: boolean;
}

export class Account {
  account: AccountSchema;
  event: ethereum.Event;
  protocol: Bridge;

  constructor(protocol: Bridge, account: AccountSchema) {
    this.account = account;
    this.protocol = protocol;
    this.event = protocol.getCurrentEvent();
  }

  private trackActivity(activityType: ActivityType): AccountWasActive {
    const days = getUnixDays(this.event);
    const hours = getUnixHours(this.event);

    const hourlyID = Bytes.fromUTF8(
      `${this.account.id.toHexString()}-hourly-${hours}-${activityType}`
    );
    const dailyID = Bytes.fromUTF8(
      `${this.account.id.toHexString()}-daily-${days}-${activityType}`
    );

    let hourly = false;
    let daily = false;
    const dAct = ActiveAccount.load(dailyID);
    if (!dAct) {
      new ActiveAccount(dailyID).save();
      daily = true;
    }

    const hAct = ActiveAccount.load(hourlyID);
    if (!hAct) {
      new ActiveAccount(hourlyID).save();
      hourly = true;
    }

    return {
      hourly,
      daily,
    };
  }

  addChain(chain: u32): void {
    if (this.account.chains.includes(chain)) {
      return;
    }

    const chains = this.account.chains;
    chains.push(chain);
    this.account.chains = chains;
    this.account.save();
  }

  transferOut(
    pool: Pool,
    route: PoolRoute,
    destination: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferOut();
    this.protocol.addActiveTransferSender(
      this.trackActivity(ActivityType.TRANSFER_OUT)
    );
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

  transferIn(
    pool: Pool,
    route: PoolRoute,
    source: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer {
    this.countTransferIn();
    this.protocol.addActiveTransferReceiver(
      this.trackActivity(ActivityType.TRANSFER_IN)
    );
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
    counterparty: Address,
    amount: BigInt,
    isOutgoing: boolean,
    transactionID: Bytes | null,
    updateMetrics: boolean
  ): BridgeTransfer {
    const _pool = pool.pool;
    const token = Tokens.initToken(Address.fromBytes(_pool.inputToken));
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
      .getAmountPrice(token, amount);
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
    const id = idFromEvent(this.event);
    const transfer = new BridgeTransfer(id);
    transfer.hash = this.event.transaction.hash;
    transfer.logIndex = this.event.logIndex.toI32();
    transfer.blockNumber = this.event.block.number;
    transfer.timestamp = this.event.block.timestamp;

    transfer.protocol = this.protocol.getBytesID();
    transfer.account = this.account.id;

    return transfer;
  }

  liquidityDeposit(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityDeposit {
    const _pool = pool.pool;
    const token = Tokens.initToken(_pool.inputToken);

    const deposit = new LiquidityDeposit(idFromEvent(this.event));
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
      .getAmountPrice(token, amount);
    deposit.chainID = this.protocol.getCurrentChainID();
    deposit.save();

    this.countDeposit();
    this.protocol.addActiveLiquidityProvider(
      this.trackActivity(ActivityType.LIQUIDITY_PROVISIONING)
    );
    if (updateMetrics) {
      pool.trackDeposit(deposit);
    }
    return deposit;
  }

  liquidityWithdraw(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityWithdraw {
    const _pool = pool.pool;
    const token = Tokens.initToken(_pool.inputToken);

    const withdraw = new LiquidityWithdraw(idFromEvent(this.event));
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
      .getAmountPrice(token, amount);
    withdraw.chainID = this.protocol.getCurrentChainID();
    withdraw.save();

    this.countWithdraw();
    this.protocol.addActiveLiquidityProvider(
      this.trackActivity(ActivityType.LIQUIDITY_PROVISIONING)
    );
    if (updateMetrics) {
      pool.trackWithdraw(withdraw);
    }
    return withdraw;
  }

  private countDeposit(): void {
    if (this.account.depositCount == 0 && this.account.withdrawCount == 0) {
      this.protocol.addLiquidityProvider();
    }
    this.account.depositCount += 1;
    this.account.save();
  }

  private countWithdraw(): void {
    if (this.account.depositCount == 0 && this.account.withdrawCount == 0) {
      this.protocol.addLiquidityProvider();
    }
    this.account.withdrawCount += 1;
    this.account.save();
  }

  private countTransferIn(): void {
    if (this.account.transferInCount == 0) {
      this.protocol.addTransferReceiver();
    }
    this.account.transferInCount += 1;
    this.account.save();
  }

  private countTransferOut(): void {
    if (this.account.transferOutCount == 0) {
      this.protocol.addTransferSender();
    }
    this.account.transferOutCount += 1;
    this.account.save();
  }
}

function idFromEvent(event: ethereum.Event): Bytes {
  return event.transaction.hash.concatI32(event.logIndex.toI32());
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
