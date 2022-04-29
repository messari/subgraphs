import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  getOrCreateDailyUsageMetricSnapshot,
  getOrCreateDexAmm,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateHourlyUsageMetricSnapshot,
  getOrCreateLiquidityPool,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
} from "../common/getters";
import { getDays, getHours } from "../common/utils/datetime";
import { BIGDECIMAL_ZERO, TransactionType } from "./constants";
import { bigIntToBigDecimal } from "./utils/numbers";

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateDexAmm();
  let protocolLockedValue = BIGDECIMAL_ZERO;

  // loop through each pool and update total value locked in USD for protocol and each pool
  for (let i = 0; i < protocol.pools.length; i++) {
    let poolLockedValue = BIGDECIMAL_ZERO;
    let pool = getOrCreateLiquidityPool(Address.fromString(protocol.pools[i]));

    for (let i = 0; i < pool.inputTokens.length; i++) {
      let token = getOrCreateToken(Address.fromString(pool.inputTokens[i]));
      let usdValue = bigIntToBigDecimal(pool.inputTokenBalances[i], token.decimals);
      poolLockedValue = poolLockedValue.plus(usdValue);
    }

    pool.totalValueLockedUSD = poolLockedValue;
    pool.save();

    protocolLockedValue = protocolLockedValue.plus(poolLockedValue);
  }

  protocol.totalValueLockedUSD = protocolLockedValue;
  protocol.save();
}

// updates the Financials of the day except revenues, which will be handled in swaps
export function updateFinancials(event: ethereum.Event): void {
  let protocol = getOrCreateDexAmm();
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  if (event.block.number > financialMetrics.blockNumber) {
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
  }

  financialMetrics.save();
}

// handle unique account overall
function handleAccount(event: ethereum.Event, user: Address, protocol: DexAmmProtocol): void {
  let account = Account.load(user.toHexString());
  if (!account) {
    account = new Account(user.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
}

// handle unique account hourly
function handleHourlyAccount(
  event: ethereum.Event,
  user: Address,
  protocol: DexAmmProtocol,
  snapshot: UsageMetricsHourlySnapshot,
): void {
  let timestamp = event.block.timestamp.toI64();
  let days = getDays(timestamp);
  let hours = getHours(timestamp);
  let hourlyAccountId = user.toHexString().concat("-").concat(days.toString()).concat("-").concat(hours.toString());

  let hourlyAccount = ActiveAccount.load(hourlyAccountId);
  if (!hourlyAccount) {
    hourlyAccount = new ActiveAccount(hourlyAccountId);
    hourlyAccount.save();

    snapshot.hourlyActiveUsers += 1;
    snapshot.save();
  }
}

// handle unique account daily
function handleDailyAccount(
  event: ethereum.Event,
  user: Address,
  protocol: DexAmmProtocol,
  snapshot: UsageMetricsDailySnapshot,
): void {
  let timestamp = event.block.timestamp.toI64();
  let days = getDays(timestamp);
  let dailyAccountId = user.toHexString().concat("-").concat(days.toString());

  let dailyAccount = ActiveAccount.load(dailyAccountId);
  if (!dailyAccount) {
    dailyAccount = new ActiveAccount(dailyAccountId);
    dailyAccount.save();

    snapshot.dailyActiveUsers += 1;
    snapshot.save();
  }
}

function updateHourlyUsageMetrics(
  event: ethereum.Event,
  user: Address,
  protocol: DexAmmProtocol,
  transactionType: TransactionType,
): void {
  let snapshot = getOrCreateHourlyUsageMetricSnapshot(event);

  handleAccount(event, user, protocol);
  handleHourlyAccount(event, user, protocol, snapshot);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.hourlyTransactionCount += 1;
  switch (transactionType) {
    case TransactionType.DEPOSIT:
      snapshot.hourlyDepositCount += 1;
    case TransactionType.WITHDRAW:
      snapshot.hourlyWithdrawCount += 1;
    case TransactionType.SWAP:
      snapshot.hourlySwapCount += 1;
  }
  snapshot.save();
}

function updateDailyUsageMetrcs(
  event: ethereum.Event,
  user: Address,
  protocol: DexAmmProtocol,
  transactionType: TransactionType,
): void {
  let snapshot = getOrCreateDailyUsageMetricSnapshot(event);

  handleAccount(event, user, protocol);
  handleDailyAccount(event, user, protocol, snapshot);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.dailyTransactionCount += 1;
  switch (transactionType) {
    case TransactionType.DEPOSIT:
      snapshot.dailyDepositCount += 1;
    case TransactionType.WITHDRAW:
      snapshot.dailyWithdrawCount += 1;
    case TransactionType.SWAP:
      snapshot.dailySwapCount += 1;
  }
  snapshot.save();
}

export function updateUsageMetrics(event: ethereum.Event, user: Address, transactionType: TransactionType): void {
  let protocol = getOrCreateDexAmm();
  updateHourlyUsageMetrics(event, user, protocol, transactionType);
  updateDailyUsageMetrcs(event, user, protocol, transactionType);
}

function updateHourlyPoolMetrics(event: ethereum.Event, pool: LiquidityPool): void {
  let snapshot = getOrCreateLiquidityPoolHourlySnapshot(event);

  // remaining fields to poplate
  // hourlyVolumeUSD; swap volume
  // hourlyVolumeByTokenAmount; swap volume
  // hourlyVolumeByTokenUSD; swap volume

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.inputTokens = pool.inputTokens;
  snapshot.outputTokens = pool.outputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokensSupply = pool.outputTokensSupply;
  snapshot.outputTokenPricesUSD = pool.outputTokenPricesUSD;
  snapshot.stakedOutputTokenAmounts = pool.stakedOutputTokenAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

function updateDailyPoolMetrics(event: ethereum.Event, pool: LiquidityPool): void {
  let snapshot = getOrCreateLiquidityPoolDailySnapshot(event);

  // remaining fields to poplate
  // dailyVolumeUSD; swap volume
  // dailyVolumeByTokenAmount; swap volume
  // dailyVolumeByTokenUSD; swap volume

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.inputTokens = pool.inputTokens;
  snapshot.outputTokens = pool.outputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokensSupply = pool.outputTokensSupply;
  snapshot.outputTokenPricesUSD = pool.outputTokenPricesUSD;
  snapshot.stakedOutputTokenAmounts = pool.stakedOutputTokenAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

export function updatePoolMetrics(event: ethereum.Event, poolAddress: Address): void {
  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(poolAddress);
  updateHourlyPoolMetrics(event, pool);
  updateDailyPoolMetrics(event, pool);
}
