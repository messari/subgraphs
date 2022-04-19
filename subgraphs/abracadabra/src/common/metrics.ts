import { BigDecimal, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount } from "../../generated/schema";
import {
  INT_ZERO,
  SECONDS_PER_DAY,
  MIM,
  BIGDECIMAL_ZERO,
  ABRA_USER_REVENUE_SHARE,
  ABRA_PROTOCOL_REVENUE_SHARE,
  DEFAULT_DECIMALS,
} from "./constants";
import {
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getMarket,
  getOrCreateToken,
} from "./getters";
import { fetchMimPriceUSD, getOrCreateTokenPriceEntity } from "./prices/prices";
import { bigIntToBigDecimal } from "./utils/numbers";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event, feesUSD: BigDecimal): void {
  // totalVolumeUSD is handled in updateMarketStats
  // feesUSD is handled in handleLogWithdrawFees
  // totalValueLockedUSD is handled in updateTVL()
  let financialsDailySnapshots = getOrCreateFinancials(event);
  // // Update the block number and timestamp to that of the last transaction of that day
  financialsDailySnapshots.blockNumber = event.block.number;
  financialsDailySnapshots.timestamp = event.block.timestamp;
  financialsDailySnapshots.totalRevenueUSD = financialsDailySnapshots.totalRevenueUSD.plus(feesUSD); // feesUSD comes from logAccrue which is accounted in MIM
  financialsDailySnapshots.supplySideRevenueUSD = financialsDailySnapshots.supplySideRevenueUSD.plus(
    feesUSD.times(ABRA_USER_REVENUE_SHARE),
  );
  financialsDailySnapshots.protocolSideRevenueUSD = financialsDailySnapshots.protocolSideRevenueUSD.plus(
    feesUSD.times(ABRA_PROTOCOL_REVENUE_SHARE),
  );
  financialsDailySnapshots.save();
}

// usageDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, to: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageDailySnapshot = getOrCreateUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.dailyTransactionCount += 1;

  let fromAccountId = from.toHexString();
  let toAccountId = to.toHexString();
  let fromAccount = Account.load(fromAccountId);
  let toAccount = Account.load(toAccountId);

  let protocol = getOrCreateLendingProtocol();
  if (!fromAccount) {
    fromAccount = new Account(fromAccountId);
    fromAccount.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }

  if (!toAccount) {
    toAccount = new Account(toAccountId);
    toAccount.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountIdFrom = id.toString() + "-" + from.toHexString();
  let dailyActiveAccountFrom = DailyActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new DailyActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.activeUsers += 1;
  }

  let dailyActiveAccountIdTo = id.toString() + "-" + from.toHexString();
  let dailyActiveAccountTo = DailyActiveAccount.load(dailyActiveAccountIdTo);
  if (!dailyActiveAccountTo) {
    dailyActiveAccountTo = new DailyActiveAccount(dailyActiveAccountIdTo);
    dailyActiveAccountTo.save();
    usageDailySnapshot.activeUsers += 1;
  }

  usageDailySnapshot.save();
}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(event: ethereum.Event): void {
  // get or create market metrics
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event);
  let market = getMarket(event.address.toHexString());
  let protocol = getOrCreateLendingProtocol();
  let inputTokenPricesUSD = [getOrCreateTokenPriceEntity(market.inputTokens[INT_ZERO]).priceUSD];

  // // Update the block number and timestamp to that of the last transaction of that day
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.protocol = protocol.id;
  marketDailySnapshot.market = market.id;
  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.inputTokenBalances = market.inputTokenBalances;
  marketDailySnapshot.inputTokenPricesUSD = inputTokenPricesUSD;
  marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketDailySnapshot.outputTokenPriceUSD = fetchMimPriceUSD(event);
  marketDailySnapshot.stableBorrowRate = market.stableBorrowRate;
  marketDailySnapshot.save();
}

export function updateTVL(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  let LendingProtocol = getOrCreateLendingProtocol();
  let financialsDailySnapshots = getOrCreateFinancials(event);
  let marketIdList = LendingProtocol.marketIdList;
  let protocolTotalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIdList.length; i++) {
    let marketAddress = marketIdList[i];
    protocolTotalValueLockedUSD = protocolTotalValueLockedUSD.plus(getMarket(marketAddress).totalValueLockedUSD);
  }
  LendingProtocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  LendingProtocol.totalDepositUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshots.totalValueLockedUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshots.totalDepositUSD = protocolTotalValueLockedUSD;
  LendingProtocol.save();
  financialsDailySnapshots.save();
}

export function updateTotalBorrows(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  let LendingProtocol = getOrCreateLendingProtocol();
  let financialsDailySnapshots = getOrCreateFinancials(event);
  let marketIdList = LendingProtocol.marketIdList;
  let totalBorrowUSD = BIGDECIMAL_ZERO;
  let mimPriceUSD = fetchMimPriceUSD(event);
  for (let i: i32 = 0; i < marketIdList.length; i++) {
    let marketAddress = marketIdList[i];
    totalBorrowUSD = totalBorrowUSD.plus(
      bigIntToBigDecimal(getMarket(marketAddress).outputTokenSupply, DEFAULT_DECIMALS).times(mimPriceUSD),
    );
  }
  LendingProtocol.totalBorrowUSD = totalBorrowUSD;
  financialsDailySnapshots.totalBorrowUSD = totalBorrowUSD;
  LendingProtocol.save();
  financialsDailySnapshots.save();
}

export function updateMarketStats(
  marketId: string,
  eventType: string,
  asset: string,
  amount: BigInt,
  event: ethereum.Event,
): void {
  let market = getMarket(marketId);
  let token_decimals = getOrCreateToken(Address.fromString(asset)).decimals;
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let priceUSD = getOrCreateTokenPriceEntity(asset).priceUSD;
  let mimPriceUSD = fetchMimPriceUSD(event);
  let tvlUSD = market.totalValueLockedUSD;
  let totalBorrowUSD = market.totalBorrowUSD;
  if (eventType == "DEPOSIT") {
    let inputTokenBalances = market.inputTokenBalances;
    let inputTokenBalance = inputTokenBalances.pop();
    tvlUSD = bigIntToBigDecimal(inputTokenBalance, token_decimals).times(priceUSD);
    inputTokenBalance = inputTokenBalance.plus(amount);
    inputTokenBalances.push(inputTokenBalance);
    market.inputTokenBalances = inputTokenBalances;
  } else if (eventType == "WITHDRAW") {
    let inputTokenBalances = market.inputTokenBalances;
    let inputTokenBalance = inputTokenBalances.pop();
    tvlUSD = bigIntToBigDecimal(inputTokenBalance, token_decimals).times(priceUSD);
    inputTokenBalance = inputTokenBalance.minus(amount);
    inputTokenBalances.push(inputTokenBalance);
    market.inputTokenBalances = inputTokenBalances;
  } else if (eventType == "BORROW") {
    let eventVolumeUSD = bigIntToBigDecimal(amount, token_decimals).times(priceUSD);
    market.totalVolumeUSD = market.totalVolumeUSD.plus(eventVolumeUSD);
    market.outputTokenSupply = market.outputTokenSupply.plus(amount);
    totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply.plus(amount)).times(mimPriceUSD);
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(eventVolumeUSD);
    protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(eventVolumeUSD);
    updateTotalBorrows(event);
  } else if (eventType == "REPAY") {
    let eventVolumeUSD = bigIntToBigDecimal(amount, token_decimals).times(priceUSD);
    market.totalVolumeUSD = market.totalVolumeUSD.plus(eventVolumeUSD);
    market.outputTokenSupply = market.outputTokenSupply.minus(amount);
    totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply.plus(amount)).times(mimPriceUSD);
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(eventVolumeUSD);
    protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(eventVolumeUSD);
    updateTotalBorrows(event);
  }
  market.totalValueLockedUSD = tvlUSD;
  market.totalDepositUSD = tvlUSD;
  market.totalBorrowUSD = totalBorrowUSD;
  market.outputTokenPriceUSD = mimPriceUSD;
  market.save();
  financialsDailySnapshot.save();
  protocol.save();
}
