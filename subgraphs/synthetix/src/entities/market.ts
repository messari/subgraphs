import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  LIQUIDATION_FEE_PERCENT,
  MAXIMUM_LTV,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import {
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  decrementProtocolOpenPositionCount,
  getOrCreateFinancialsSnapshot,
  getOrCreateProtocol,
  incrementProtocolPositionCount,
  updateProtocolUSDLocked,
} from "./protocol";
import { getCurrentETHPrice, getOrCreateToken } from "./token";
import { getOrCreateStableBorrowerInterestRate } from "./rate";

export function getOrCreateMarket(
  address: string,
  event: ethereum.Event
): Market {
  let market = Market.load(address);
  if (!market) {
    const token = getOrCreateToken(address);
    market = new Market(address);
    market.protocol = getOrCreateProtocol().id;
    market.name = token.name;
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = MAXIMUM_LTV;
    market.liquidationThreshold = MAXIMUM_LTV;
    market.liquidationPenalty = LIQUIDATION_FEE_PERCENT;
    market.inputToken = token.id;
    market.rates = [getOrCreateStableBorrowerInterestRate(address).id];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;

    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;

    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;

    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;
    market.save();
  }
  return market;
}

export function getOrCreateMarketSnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  let marketSnapshot = MarketDailySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = market.rates;
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  market: Market
): MarketHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hour: i64 = timestamp / SECONDS_PER_HOUR;
  const id = `${market.id}-${hour}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = market.rates;
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function setMarketTokenBalance(
  event: ethereum.Event,
  balance: BigInt,
  balanceUSD: BigDecimal,
  market: Market
): void {
  const netChangeUSD = balanceUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = balanceUSD;
  market.totalDepositBalanceUSD = balanceUSD;
  market.inputTokenBalance = balance;
  market.inputTokenPriceUSD = getCurrentETHPrice();
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolUSDLocked(event, netChangeUSD);
}

export function addMarketDepositVolume(
  event: ethereum.Event,
  depositedUSD: BigDecimal,
  market: Market
): void {
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(depositedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyDepositUSD =
    dailySnapshot.dailyDepositUSD.plus(depositedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyDepositUSD =
    hourlySnapshot.hourlyDepositUSD.plus(depositedUSD);
  hourlySnapshot.save();
  addProtocolDepositVolume(event, depositedUSD);
}

export function addMarketWithdrawVolume(
  event: ethereum.Event,
  withdrawUSD: BigDecimal,
  market: Market
): void {
  const protocol = getOrCreateProtocol();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyWithdrawUSD =
    financialsSnapshot.dailyWithdrawUSD.plus(withdrawUSD);
  financialsSnapshot.save();

  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyWithdrawUSD =
    dailySnapshot.dailyWithdrawUSD.plus(withdrawUSD);
  dailySnapshot.save();

  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyWithdrawUSD =
    hourlySnapshot.hourlyWithdrawUSD.plus(withdrawUSD);
  hourlySnapshot.save();
}

export function addMarketRepayVolume(
  event: ethereum.Event,
  repayUSD: BigDecimal,
  market: Market
): void {
  const protocol = getOrCreateProtocol();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyRepayUSD =
    financialsSnapshot.dailyRepayUSD.plus(repayUSD);
  financialsSnapshot.save();

  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(repayUSD);
  dailySnapshot.save();

  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyRepayUSD = hourlySnapshot.hourlyRepayUSD.plus(repayUSD);
  hourlySnapshot.save();
}

export function addMarketLiquidateVolume(
  event: ethereum.Event,
  liquidatedUSD: BigDecimal,
  market: Market
): void {
  market.cumulativeLiquidateUSD =
    market.cumulativeLiquidateUSD.plus(liquidatedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyLiquidateUSD =
    dailySnapshot.dailyLiquidateUSD.plus(liquidatedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyLiquidateUSD =
    hourlySnapshot.hourlyLiquidateUSD.plus(liquidatedUSD);
  hourlySnapshot.save();
  addProtocolLiquidateVolume(event, liquidatedUSD);
}

export function addMarketBorrowVolume(
  event: ethereum.Event,
  borrowedUSD: BigDecimal,
  market: Market
): void {
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrowedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(borrowedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyBorrowUSD =
    hourlySnapshot.hourlyBorrowUSD.plus(borrowedUSD);
  hourlySnapshot.save();
  addProtocolBorrowVolume(event, borrowedUSD);
}

export function openMarketBorrowerPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.borrowingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function openMarketLenderPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.lendingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function closeMarketPosition(market: Market): void {
  market.openPositionCount -= 1;
  market.closedPositionCount += 1;
  market.save();
  decrementProtocolOpenPositionCount();
}
