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
  addUSDVolume,
  getOrCreateLiquityProtocol,
  updateUsageMetrics,
} from "./protocol";
import { getOrCreateMarket } from "./market";
import { getETHToken, getLUSDToken } from "./token";
import { prefixID } from "../utils/strings";

export function createDeposit(
  event: ethereum.Event,
  amountETH: BigInt,
  amountUSD: BigDecimal,
  sender: Address
): void {
  if (amountETH.le(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amountETH.toString()]);
  }
  const deposit = new Deposit(
    prefixID(
      "deposit",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateLiquityProtocol().id;
  deposit.to = ACTIVE_POOL;
  deposit.from = sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = getOrCreateMarket().id;
  deposit.asset = getETHToken().id;
  deposit.amount = amountETH;
  deposit.amountUSD = amountUSD;
  deposit.save();
  updateUsageMetrics(event, sender);
}

export function createWithdraw(
  event: ethereum.Event,
  amountETH: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountETH.le(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amountETH.toString()]);
  }
  const withdraw = new Withdraw(
    prefixID(
      "withdraw",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateLiquityProtocol().id;
  withdraw.to = recipient.toHexString();
  withdraw.from = ACTIVE_POOL;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = getOrCreateMarket().id;
  withdraw.asset = getETHToken().id;
  withdraw.amount = amountETH;
  withdraw.amountUSD = amountUSD;
  withdraw.save();
  updateUsageMetrics(event, recipient);
}

export function createBorrow(
  event: ethereum.Event,
  amountLUSD: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountLUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amountLUSD.toString()]);
  }
  const borrow = new Borrow(
    prefixID(
      "borrow",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = getOrCreateLiquityProtocol().id;
  borrow.to = recipient.toHexString();
  borrow.from = ZERO_ADDRESS; // LUSD is minted
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = getOrCreateMarket().id;
  borrow.asset = getLUSDToken().id;
  borrow.amount = amountLUSD;
  borrow.amountUSD = amountUSD;
  borrow.save();
  updateUsageMetrics(event, recipient);
  addUSDVolume(event, amountUSD);
}

export function createRepay(
  event: ethereum.Event,
  amountLUSD: BigInt,
  amountUSD: BigDecimal,
  sender: Address
): void {
  if (amountLUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amountLUSD.toString()]);
  }
  const repay = new Repay(
    prefixID(
      "repay",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = getOrCreateLiquityProtocol().id;
  repay.to = ZERO_ADDRESS; // LUSD is burned
  repay.from = sender.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = getOrCreateMarket().id;
  repay.asset = getLUSDToken().id;
  repay.amount = amountLUSD;
  repay.amountUSD = amountUSD;
  repay.save();
  updateUsageMetrics(event, sender);
}

export function createLiquidate(
  event: ethereum.Event,
  amountLiquidated: BigInt,
  amountLiquidatedUSD: BigDecimal,
  profitUSD: BigDecimal,
  liquidator: Address
): void {
  const liquidate = new Liquidate(
    prefixID(
      "liquidate",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = getOrCreateLiquityProtocol().id;
  // Liquidated funds may be spread across multiple addresses:
  // https://github.com/liquity/dev#liquidation-logic
  // but there is no data for this, so this is set to stability pool address
  liquidate.to = STABILITY_POOL;
  liquidate.from = liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = getOrCreateMarket().id;
  liquidate.asset = getETHToken().id;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountLiquidatedUSD;
  liquidate.profitUSD = profitUSD;
  liquidate.save();
  updateUsageMetrics(event, liquidator);
}
