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
  Liquidation,
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
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-deposit`
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
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-withdraw`
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
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-borrow`
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
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-repay`
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

export function createLiquidation(
  event: ethereum.Event,
  amountLiquidated: BigInt,
  amountLiquidatedUSD: BigDecimal,
  profitUSD: BigDecimal,
  liquidator: Address
): void {
  const liquidation = new Liquidation(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}-liquidation`
  );
  liquidation.hash = event.transaction.hash.toHexString();
  liquidation.logIndex = event.logIndex.toI32();
  liquidation.protocol = getOrCreateLiquityProtocol().id;
  // Liquidated funds may be spread across multiple addresses:
  // https://github.com/liquity/dev#liquidation-logic
  // but there is no data for this, so this is set to stability pool address
  liquidation.to = STABILITY_POOL;
  liquidation.from = liquidator.toHexString();
  liquidation.blockNumber = event.block.number;
  liquidation.timestamp = event.block.timestamp;
  liquidation.market = getOrCreateMarket().id;
  liquidation.asset = getETHToken().id;
  liquidation.amount = amountLiquidated;
  liquidation.amountUSD = amountLiquidatedUSD;
  liquidation.profitUSD = profitUSD;
  liquidation.save();
  updateUsageMetrics(event, liquidator);
}
