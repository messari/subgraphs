import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  RewardToken,
} from "../../../../generated/schema";
import { ReserveDataUpdated } from "../../../../generated/templates/Pool/Pool";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_SECONDS_PER_DAY,
  BIGINT_ZERO,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../../../../src/utils/constants";
import { bigIntToBigDecimal } from "../../../../src/utils/numbers";
import { amountInUSD, getAssetPrice } from "./price";
import {
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  addProtocolRepayVolume,
  addProtocolSideRevenue,
  addProtocolWithdrawVolume,
  addSupplySideRevenue,
  decrementProtocolOpenPositionCount,
  getOrCreateLendingProtocol,
  incrementProtocolPositionCount,
  updateProtocolBorrowBalance,
  updateProtocolTVL,
} from "./protocol";
import { createInterestRatesFromEvent } from "./rate";
import { getOrCreateToken, getRewardTokenById, getTokenById } from "./token";
import { incrementProtocolTotalPoolCount } from "./usage";

export function getMarket(address: Address): Market {
  const id = address.toHexString();
  return Market.load(id)!;
}

export function getMarketById(id: string): Market {
  return Market.load(id)!;
}

export function createMarket(
  event: ethereum.Event,
  reserve: Address,
  aToken: Address
): void {
  const id = reserve.toHexString();
  let market = Market.load(id);
  if (!market) {
    const token = getOrCreateToken(reserve);
    market = new Market(id);
    market.protocol = getOrCreateLendingProtocol().id;
    market.name = token.name;
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.inputToken = token.id;
    market.outputToken = getOrCreateToken(aToken, id).id;
    market.rates = [];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market.exchangeRate = BIGDECIMAL_ONE;

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
    incrementProtocolTotalPoolCount(event);
  }
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

export function addMarketDepositVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyDepositUSD = dailySnapshot.dailyDepositUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyDepositUSD =
    hourlySnapshot.hourlyDepositUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolDepositVolume(event, amountUSD);
}

export function addMarketWithdrawVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyWithdrawUSD =
    dailySnapshot.dailyWithdrawUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyWithdrawUSD =
    hourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolWithdrawVolume(event, amountUSD);
}

export function addMarketLiquidateVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(amountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyLiquidateUSD =
    dailySnapshot.dailyLiquidateUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyLiquidateUSD =
    hourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolLiquidateVolume(event, amountUSD);
}

export function addMarketBorrowVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyBorrowUSD =
    hourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolBorrowVolume(event, amountUSD);
}

export function addMarketRepayVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyRepayUSD = hourlySnapshot.hourlyRepayUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolRepayVolume(event, amountUSD);
}

export function updateMarketBorrowBalance(
  event: ethereum.Event,
  market: Market,
  balance: BigInt
): void {
  const amountUSD = amountInUSD(balance, getTokenById(market.id));
  const changeUSD = amountUSD.minus(market.totalBorrowBalanceUSD);
  market.totalBorrowBalanceUSD = amountUSD;
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(event, changeUSD);
}

export function updateMarketRates(event: ReserveDataUpdated): void {
  const reserve = event.params.reserve;
  const market = getMarket(reserve);
  const newRates = createInterestRatesFromEvent(market.id, event);
  market.rates = newRates;
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function updateOutputTokenSupply(
  event: ethereum.Event,
  marketId: string,
  supply: BigInt
): void {
  const market = getMarketById(marketId);
  market.inputTokenBalance = supply;
  market.outputTokenSupply = supply;
  updateMarketTVL(event, market);
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function addMarketSupplySideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addSupplySideRevenue(event, revenueAmountUSD);
}

export function addMarketProtocolSideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addProtocolSideRevenue(event, revenueAmountUSD);
}

export function updateMarketRewardTokens(
  event: ethereum.Event,
  market: Market,
  rewardToken: RewardToken,
  emissionRate: BigInt
): void {
  let rewardTokens = market.rewardTokens;
  let rewardTokenEmissions = market.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  if (rewardTokens == null) {
    rewardTokens = [];
    rewardTokenEmissions = [];
    rewardTokenEmissionsUSD = [];
  }
  let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    rewardTokenIndex = rewardTokens.push(rewardToken.id) - 1;
    rewardTokenEmissions!.push(BIGINT_ZERO);
    rewardTokenEmissionsUSD!.push(BIGDECIMAL_ZERO);
  }
  rewardTokenEmissions![rewardTokenIndex] = emissionRate.times(
    BIGINT_SECONDS_PER_DAY
  );
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  
  sortRewardTokens(market);
  updateMarketRewardTokenEmissions(event, market);
}

function updateMarketRewardTokenEmissions(
  event: ethereum.Event,
  market: Market
): void {
  if (market.rewardTokens == null) {
    return;
  }
  const rewardTokens = market.rewardTokens!;
  const rewardTokenEmissions = market.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!;
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = getRewardTokenById(rewardTokens[i]);
    if (event.block.timestamp.gt(rewardToken.distributionEnd)) {
      rewardTokenEmissions[i] = BIGINT_ZERO;
    }
    rewardTokenEmissionsUSD[i] = amountInUSD(
      rewardTokenEmissions[i],
      getTokenById(rewardToken.token)
    );
  }
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  market.save();
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

function updateMarketTVL(event: ethereum.Event, market: Market): void {
  const token = getTokenById(market.inputToken);
  const price = getAssetPrice(token);
  const totalValueLocked = bigIntToBigDecimal(
    market.inputTokenBalance,
    token.decimals
  ).times(price);
  updateProtocolTVL(event, totalValueLocked.minus(market.totalValueLockedUSD));
  market.inputTokenPriceUSD = price;
  market.outputTokenPriceUSD = price;
  market.totalValueLockedUSD = totalValueLocked;
  market.totalDepositBalanceUSD = totalValueLocked;
  updateMarketRewardTokenEmissions(event, market);
}

function sortRewardTokens(market: Market): void {
  if (market.rewardTokens!.length <= 1) {
    return;
  }

  let tokens = market.rewardTokens;
  let emissions = market.rewardTokenEmissionsAmount;
  let emissionsUSD = market.rewardTokenEmissionsUSD;
  multiArraySort(tokens!, emissions!, emissionsUSD!);

  market.rewardTokens = tokens;
  market.rewardTokenEmissionsAmount = emissions;
  market.rewardTokenEmissionsUSD = emissionsUSD;
}

function multiArraySort(ref: Array<string>, arr1: Array<BigInt>, arr2: Array<BigDecimal>): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  let sorter : Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i], arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function(a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = sorter[i][0];
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
}