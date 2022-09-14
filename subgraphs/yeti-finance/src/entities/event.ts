import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Repay,
  Withdraw,
} from "../../generated/schema";
import {
  ACTIVE_POOL,
  BIGINT_ZERO,
  STABILITY_POOL,
  ZERO_ADDRESS,
} from "../utils/constants";
import {
  addProtocolBorrowVolume,
  addProtocolLiquidateVolume,
  getOrCreateYetiProtocol,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "./protocol";
import {
  addMarketBorrowVolume,
  addMarketDepositVolume,
  addMarketLiquidateVolume,
  getOrCreateMarket,
} from "./market";
import { getOrCreateToken, getYUSDToken } from "./token";
import { prefixID } from "../utils/strings";

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
  sender: Address,
  asset: Address
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amount.toString()]);
  }
  const deposit = new Deposit(
    prefixID(
      "deposit",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-${asset.toHexString()}`
    )
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateYetiProtocol().id;
  deposit.to = ACTIVE_POOL;
  deposit.from = sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = getOrCreateMarket(asset).id;
  deposit.asset = getOrCreateToken(asset).id;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD;
  deposit.save();
  addMarketDepositVolume(event, amountUSD, asset);
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
  recipient: Address,
  asset: Address
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amount.toString()]);
  }
  const withdraw = new Withdraw(
    prefixID(
      "withdraw",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-${asset.toHexString()}`
    )
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateYetiProtocol().id;
  withdraw.to = recipient.toHexString();
  withdraw.from = ACTIVE_POOL;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = getOrCreateMarket(asset).id;
  withdraw.asset = getOrCreateToken(asset).id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD;
  withdraw.save();
}

export function createBorrow(
  event: ethereum.Event,
  amountYUSD: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountYUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amountYUSD.toString()]);
  }
  const borrow = new Borrow(
    prefixID(
      "borrow",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = getOrCreateYetiProtocol().id;
  borrow.to = recipient.toHexString();
  borrow.from = ZERO_ADDRESS; // YUSD is minted
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.asset = getYUSDToken().id;
  borrow.amount = amountYUSD;
  borrow.amountUSD = amountUSD;
  borrow.save();
  addProtocolBorrowVolume(event, amountUSD);
}

export function createRepay(
  event: ethereum.Event,
  amountYUSD: BigInt,
  amountUSD: BigDecimal,
  sender: Address
): void {
  if (amountYUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amountYUSD.toString()]);
  }
  const repay = new Repay(
    prefixID(
      "repay",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = getOrCreateYetiProtocol().id;
  repay.to = ZERO_ADDRESS; // YUSD is burned
  repay.from = sender.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.asset = getYUSDToken().id;
  repay.amount = amountYUSD;
  repay.amountUSD = amountUSD;
  repay.save();
  incrementProtocolRepayCount(event);

}

export function createLiquidate(
  event: ethereum.Event,
  amountLiquidated: BigInt,
  amountLiquidatedUSD: BigDecimal,
  profitUSD: BigDecimal,
  liquidator: Address,
  asset: Address
): void {
  const liquidate = new Liquidate(
    prefixID(
      "liquidate",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-${asset.toHexString()}`
    )
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = getOrCreateYetiProtocol().id;

  liquidate.to = STABILITY_POOL;
  liquidate.from = liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = getOrCreateMarket(asset).id;
  liquidate.asset = getOrCreateToken(asset).id;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountLiquidatedUSD;
  liquidate.profitUSD = profitUSD;
  liquidate.save();
  addMarketLiquidateVolume(event, amountLiquidatedUSD, asset);
  addProtocolLiquidateVolume(event, amountLiquidatedUSD);

  incrementProtocolLiquidateCount(event);
}
