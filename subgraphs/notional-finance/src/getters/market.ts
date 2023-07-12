import { ethereum } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  MarketsStatus,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  SECONDS_PER_HOUR,
} from "../common/constants";
import { getNameFromCurrency, getTokenFromCurrency } from "../common/util";
import { getOrCreateLendingProtocol } from "./protocol";
import { getOrCreateInterestRate } from "./interestRate";

export function getOrCreateMarket(
  event: ethereum.Event,
  marketId: string
): Market {
  let market = Market.load(marketId);

  if (market == null) {
    const protocol = getOrCreateLendingProtocol();
    protocol.totalPoolCount += 1;
    protocol.save();

    const currencyId = marketId.split("-")[0];
    const maturity = marketId.split("-")[1];

    // market metadata
    market = new Market(marketId);
    market.protocol = protocol.id;
    market.name = getNameFromCurrency(currencyId) + "-" + maturity;

    // market properties
    market.isActive = true;
    market.canUseAsCollateral = true; // positive fCash balances can be used collateral
    market.canBorrowFrom = true;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;

    // market tokens
    market.inputToken = getTokenFromCurrency(event, currencyId).id;
    market.outputToken = "";
    market.rewardTokens = [];
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO; // Not fixed supply.
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO; // There is no price.

    // market rates
    const interestRate = getOrCreateInterestRate(market.id);
    market.rates = [interestRate.id];
    market.exchangeRate = BIGDECIMAL_ZERO;

    // revenue
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    // metadata
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    // positions
    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;

    // helper for rev calc
    market._prevDailyId = "";

    market.save();
  }

  return market;
}

export function getOrCreateMarketDailySnapshot(
  event: ethereum.Event,
  dailyId: i64,
  marketId: string
): MarketDailySnapshot {
  const id = "daily-" + marketId + "-" + dailyId.toString();

  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(event, marketId);
  let marketMetrics = MarketDailySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketDailySnapshot(id);

    marketMetrics.protocol = protocol.id;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = market.rates;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  marketId: string
): MarketHourlySnapshot {
  // Hours since Unix epoch time
  const hourlyId = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const id = "hourly-" + marketId + "-" + hourlyId.toString();

  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(event, marketId);
  let marketMetrics = MarketHourlySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketHourlySnapshot(id);

    marketMetrics.protocol = protocol.id;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = market.rates;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getMarketsWithStatus(event: ethereum.Event): MarketsStatus {
  const id = "0";
  let marketsStatus = MarketsStatus.load(id);

  if (marketsStatus == null) {
    marketsStatus = new MarketsStatus(id);

    marketsStatus.lastUpdateBlockNumber = event.block.number;
    marketsStatus.lastUpdateTimestamp = event.block.timestamp;
    marketsStatus.lastUpdateTransactionHash = event.transaction.hash;
    marketsStatus.activeMarkets = [];
    marketsStatus.maturedMarkets = [];
    marketsStatus.save();
  }

  return marketsStatus as MarketsStatus;
}
