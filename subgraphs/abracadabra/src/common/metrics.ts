import { BigDecimal, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { _Account, _DailyActiveAccount } from "../../generated/schema";
import {
  INT_ZERO,
  INT_ONE,
  SECONDS_PER_DAY,
  MIM,
  BIGDECIMAL_ZERO,
  ABRA_USER_REVENUE_SHARE,
  ABRA_PROTOCOL_REVENUE_SHARE,
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
import { getTreasuryBalance } from "../staking";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event, feesUSD: BigDecimal): void {
  // totalVolumeUSD is handled in updateMarketStats
  // feesUSD is handled in handleLogWithdrawFees
  // totalValueLockedUSD is handled in updateTVL()
  let financialsDailySnapshots = getOrCreateFinancials(event);
  let treasuryBalanceUSD = getTreasuryBalance();
  // // Update the block number and timestamp to that of the last transaction of that day
  financialsDailySnapshots.blockNumber = event.block.number;
  financialsDailySnapshots.timestamp = event.block.timestamp;
  financialsDailySnapshots.feesUSD = financialsDailySnapshots.feesUSD.plus(feesUSD); // feesUSD comes from logAccrue which is accounted in MIM
  financialsDailySnapshots.supplySideRevenueUSD = financialsDailySnapshots.supplySideRevenueUSD.plus(
    feesUSD.times(ABRA_USER_REVENUE_SHARE),
  );
  financialsDailySnapshots.protocolSideRevenueUSD = financialsDailySnapshots.protocolSideRevenueUSD.plus(
    feesUSD.times(ABRA_PROTOCOL_REVENUE_SHARE),
  );
  financialsDailySnapshots.protocolTreasuryUSD = treasuryBalanceUSD;
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
  let fromAccount = _Account.load(fromAccountId);
  let toAccount = _Account.load(toAccountId);

  let protocol = getOrCreateLendingProtocol();
  if (!fromAccount) {
    fromAccount = new _Account(fromAccountId);
    fromAccount.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }

  if (!toAccount) {
    toAccount = new _Account(toAccountId);
    toAccount.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountIdFrom = id.toString() + "-" + from.toHexString();
  let dailyActiveAccountFrom = _DailyActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new _DailyActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.activeUsers += 1;
  }

  let dailyActiveAccountIdTo = id.toString() + "-" + from.toHexString();
  let dailyActiveAccountTo = _DailyActiveAccount.load(dailyActiveAccountIdTo);
  if (!dailyActiveAccountTo) {
    dailyActiveAccountTo = new _DailyActiveAccount(dailyActiveAccountIdTo);
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
  financialsDailySnapshots.totalValueLockedUSD = protocolTotalValueLockedUSD;
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
  let priceUSD = getOrCreateTokenPriceEntity(asset).priceUSD;
  if (eventType == "DEPOSIT") {
    let inputTokenBalances = market.inputTokenBalances;
    let inputTokenBalance = inputTokenBalances.pop();
    let tvlUSD = bigIntToBigDecimal(inputTokenBalance, token_decimals).times(priceUSD);
    inputTokenBalance = inputTokenBalance.plus(amount);
    inputTokenBalances.push(inputTokenBalance);
    market.inputTokenBalances = inputTokenBalances;
    market.totalValueLockedUSD = tvlUSD;
  } else if (eventType == "WITHDRAW") {
    let inputTokenBalances = market.inputTokenBalances;
    let inputTokenBalance = inputTokenBalances.pop();
    let tvlUSD = bigIntToBigDecimal(inputTokenBalance, token_decimals).times(priceUSD);
    inputTokenBalance = inputTokenBalance.minus(amount);
    inputTokenBalances.push(inputTokenBalance);
    market.inputTokenBalances = inputTokenBalances;
    market.totalValueLockedUSD = tvlUSD;
  } else if (eventType == "BORROW") {
    market.outputTokenSupply = market.outputTokenSupply.plus(amount);
    market.totalVolumeUSD = market.totalVolumeUSD.plus(bigIntToBigDecimal(amount, token_decimals).times(priceUSD));
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(
      bigIntToBigDecimal(amount, token_decimals).times(priceUSD),
    );
  } else if (eventType == "REPAY") {
    market.outputTokenSupply = market.outputTokenSupply.minus(amount);
    market.totalVolumeUSD = market.totalVolumeUSD.plus(bigIntToBigDecimal(amount, token_decimals).times(priceUSD));
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(
      bigIntToBigDecimal(amount, token_decimals).times(priceUSD),
    );
  }
  financialsDailySnapshot.save();
  market.outputTokenPriceUSD = getOrCreateTokenPriceEntity(MIM).priceUSD;
  market.save();
}
