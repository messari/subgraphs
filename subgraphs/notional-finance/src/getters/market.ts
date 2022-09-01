import { Address, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { Notional } from "../../generated/Notional/Notional";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  PROTOCOL_ID,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  ZERO_ADDRESS,
} from "../common/constants";
import { getTokenFromCurrency } from "../common/util";
import { bigIntToBigDecimal } from "../common/numbers";
import { getOrCreateInterestRate } from "./InterestRate";
import { getOrCreateLendingProtocol } from "./protocol";

// TODO: create all tokens necessary
// - cTokens (cETH, cDAI, cUSDC, cWBTC)
// - fCash (fMaturityDateETH, fMaturityDateDAI, fMaturityDateUSDC, fMaturityDateWBTC)

// TODO: get currencies
// - either get them as constants
// - or, get them https://github.com/notional-finance/subgraph-v2/blob/d851d9b18e55eb0698337314c6f176058b5b5350/src/notional.ts#L84

export function getOrCreateMarket(
  event: ethereum.Event,
  marketId: string
): Market {
  // TODO: take currency, maturity and create the marketId here to avoid inconsistency?
  let market = Market.load(marketId);

  if (market == null) {
    let protocol = getOrCreateLendingProtocol();
    protocol.totalPoolCount += 1;
    protocol.save();

    let currencyId = marketId.split("-")[0];

    // market metadata
    market = new Market(marketId);
    market.protocol = protocol.id;
    market.name = marketId;

    // market properties
    market.isActive = true;
    market.canUseAsCollateral = true; // positive fCash balances can be used collateral
    market.canBorrowFrom = true;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;

    // TODO: verify liquidation penalty
    let notional = Notional.bind(Address.fromString(PROTOCOL_ID));
    let currencyAndRatesCallResult = notional.try_getCurrencyAndRates(
      parseInt(currencyId)
    );
    if (currencyAndRatesCallResult.reverted) {
      log.info("Notional call 'getCurrencyAndRates' reverted", []);
      market.liquidationPenalty = BIGDECIMAL_ZERO;
    } else {
      market.liquidationPenalty = bigIntToBigDecimal(
        currencyAndRatesCallResult.value.getEthRate().liquidationDiscount
      );
    }

    // market tokens
    market.inputToken = getTokenFromCurrency(event, currencyId).id;
    // TODO: How do we represent ERC-1155 fCash
    // ERC1155Action - 0xBf12d7e41a25f449293AB8cd1364Fe74A175bFa5
    // Notional ERC1155 Token - https://etherscan.io/token/0x1344a36a1b56144c3bc62e7757377d288fde0369#inventory
    market.outputToken = "";
    market.rewardTokens = [];
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO; // Not fixed supply.
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO; // There is no price.
    market.rates = [];
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

    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    // positions
    // market.positions - derived
    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;

    // snapshots - derived
    // market.dailySnapshots
    // market.hourlySnapshots

    // events - derived
    // market.deposits
    // market.withdraws
    // market.borrows
    // market.repays
    // market.liquidates

    market.save();

    // TODO: update market status
    // let activeMarketsCallResult = notional.try_getActiveMarkets(
    //   parseInt(currencyId)
    // );
    // if (activeMarketsCallResult.reverted) {
    //   log.info("Notional call 'getActiveMarkets' reverted", []);
    // } else {
    //   // update subgraph market to inacitve
    //   let activeMarkets = activeMarketsCallResult.value;
    //   let allSubgraphMarkets = TBD
    //   loop through allSubgraphMarkets
    //    market subgraphMarket as inactive if its not in activeMarkets
    // }
  }

  return market;
}

export function getOrCreateMarketDailySnapshot(
  event: ethereum.Event,
  marketId: string
): MarketDailySnapshot {
  let dailyId = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let id = "daily-" + marketId + "-" + dailyId.toString();

  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(event, marketId);
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
  let hourlyId = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let id = "hourly-" + marketId + "-" + hourlyId.toString();

  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(event, marketId);
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
