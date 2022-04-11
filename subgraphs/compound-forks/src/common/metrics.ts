// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricSnapshot,
} from "./getters";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { _Account, _DailyActiveAccount } from "../../generated/schema";
import { SECONDS_PER_DAY } from "./utils/constants";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event, protocolAddress: string): void {
  // number of days since unix epoch
  let financialMetrics = getOrCreateFinancials(event, protocolAddress);
  let protocol = getOrCreateLendingProtcol(protocolAddress);

  // update value/volume vars
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.totalVolumeUSD = protocol._totalVolumeUSD;

  if (event.block.number > financialMetrics.blockNumber) {
    // get block difference to catch any blocks that have no transactions (unlikely, but needs to be accounted)
    let blockDiff = event.block.number.minus(financialMetrics.blockNumber).toBigDecimal();

    // only add to revenues if the financialMetrics has not seen this block number
    for (let i = 0; i < protocol._marketIds.length; i++) {
      let market = getOrCreateMarket(event, event.address, protocolAddress);

      financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
        market._supplySideRevenueUSDPerBlock.times(blockDiff),
      );
      financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(
        market._protocolSideRevenueUSDPerBlock.times(blockDiff),
      );

      // fees are just the totalRevenue (to be changed: https://github.com/messari/subgraphs/pull/47)
      financialMetrics.feesUSD = financialMetrics.feesUSD.plus(market._totalRevenueUSDPerBlock.times(blockDiff));
    }
  }

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, protocolAddress: string): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricSnapshot(event, protocolAddress);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateLendingProtcol(protocolAddress);
  if (!account) {
    account = new _Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// update a given MarketDailySnapshot
export function updateMarketMetrics(event: ethereum.Event, protocolAddress: string): void {
  // Number of days since Unix epoch
  let marketMetrics = getOrCreateMarketDailySnapshot(event, protocolAddress);
  let market = getOrCreateMarket(event, event.address, protocolAddress);

  // update to latest block/timestamp
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  // update other vars
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.inputTokenBalances = market.inputTokenBalances;
  let inputTokenPrices = marketMetrics.inputTokenPricesUSD;
  inputTokenPrices[0] = market._inputTokenPrice;
  marketMetrics.inputTokenPricesUSD = inputTokenPrices;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  // lending-specific vars
  marketMetrics.depositRate = market.depositRate;
  marketMetrics.stableBorrowRate = market.stableBorrowRate;
  marketMetrics.variableBorrowRate = market.variableBorrowRate;

  marketMetrics.save();
}
