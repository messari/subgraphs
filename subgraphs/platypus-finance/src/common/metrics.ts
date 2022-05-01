import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, Swap } from "../../generated/schema";
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
import { BIGDECIMAL_TWO, BIGDECIMAL_ZERO, SECONDS_PER_HOUR, TransactionType } from "./constants";
import { bigIntToBigDecimal, exponentToBigDecimal, tokenAmountToUSDAmount } from "./utils/numbers";

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateDexAmm();
  let protocolLockedValue = BIGDECIMAL_ZERO;

  // loop through each pool and update total value locked in USD for protocol and each pool
  for (let i = 0; i < protocol.pools.length; i++) {
    let poolLockedValue = BIGDECIMAL_ZERO;
    let pool = getOrCreateLiquidityPool(Address.fromString(protocol.pools[i]));

    for (let i = 0; i < pool.inputTokens.length; i++) {
      let token = getOrCreateToken(event, Address.fromString(pool.inputTokens[i]));
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

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// handle unique account overall
function handleAccount(event: ethereum.Event, user: Address): void {
  let protocol = getOrCreateDexAmm();
  let account = Account.load(user.toHexString());
  if (!account) {
    account = new Account(user.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
}

// handle unique account hourly
function handleHourlyAccount(event: ethereum.Event, user: Address): void {
  let snapshot = getOrCreateHourlyUsageMetricSnapshot(event);
  let hourlyAccountId = user.toHexString() + "-" + (event.block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let hourlyAccount = ActiveAccount.load(hourlyAccountId.toString());
  if (!hourlyAccount) {
    hourlyAccount = new ActiveAccount(hourlyAccountId);
    hourlyAccount.save();

    snapshot.hourlyActiveUsers += 1;
    snapshot.save();
  }
}

// handle unique account daily
function handleDailyAccount(event: ethereum.Event, user: Address): void {
  let snapshot = getOrCreateDailyUsageMetricSnapshot(event);
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

function updateHourlyUsageMetrics(event: ethereum.Event, user: Address, transactionType: TransactionType): void {
  handleHourlyAccount(event, user);

  let snapshot = getOrCreateHourlyUsageMetricSnapshot(event);
  let protocol = getOrCreateDexAmm();

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.hourlyTransactionCount += 1;
  switch (transactionType) {
    case TransactionType.DEPOSIT:
      snapshot.hourlyDepositCount += 1;
      break;
    case TransactionType.WITHDRAW:
      snapshot.hourlyWithdrawCount += 1;
      break;
    case TransactionType.SWAP:
      snapshot.hourlySwapCount += 1;
      break;
  }
  snapshot.save();
}

function updateDailyUsageMetrcs(event: ethereum.Event, user: Address, transactionType: TransactionType): void {
  handleDailyAccount(event, user);

  let snapshot = getOrCreateDailyUsageMetricSnapshot(event);
  let protocol = getOrCreateDexAmm();

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.dailyTransactionCount += 1;
  switch (transactionType) {
    case TransactionType.DEPOSIT:
      snapshot.dailyDepositCount += 1;
      break;
    case TransactionType.WITHDRAW:
      snapshot.dailyWithdrawCount += 1;
      break;
    case TransactionType.SWAP:
      snapshot.dailySwapCount += 1;
      break;
  }
  snapshot.save();
}

export function updateUsageMetrics(event: ethereum.Event, user: Address, transactionType: TransactionType): void {
  handleAccount(event, user);
  updateHourlyUsageMetrics(event, user, transactionType);
  updateDailyUsageMetrcs(event, user, transactionType);
}

function updateHourlyPoolMetrics(event: ethereum.Event): void {
  let snapshot = getOrCreateLiquidityPoolHourlySnapshot(event);
  let pool = getOrCreateLiquidityPool(event.address);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.inputTokens = pool.inputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot._outputTokens = pool._outputTokens;
  snapshot._outputTokensSupply = pool._outputTokensSupply;
  snapshot._outputTokenPricesUSD = pool._outputTokenPricesUSD;
  snapshot._stakedOutputTokenAmounts = pool._stakedOutputTokenAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

function updateDailyPoolMetrics(event: ethereum.Event): void {
  let snapshot = getOrCreateLiquidityPoolDailySnapshot(event);
  let pool = getOrCreateLiquidityPool(event.address);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.inputTokens = pool.inputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot._outputTokens = pool._outputTokens;
  snapshot._outputTokensSupply = pool._outputTokensSupply;
  snapshot._outputTokenPricesUSD = pool._outputTokenPricesUSD;
  snapshot._stakedOutputTokenAmounts = pool._stakedOutputTokenAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

export function updatePoolMetrics(event: ethereum.Event): void {
  updateHourlyPoolMetrics(event);
  updateDailyPoolMetrics(event);
}

export function calculateSwapVolume(swap: Swap): BigDecimal {
  return swap.amountInUSD.plus(swap.amountOutUSD).div(BIGDECIMAL_TWO);
}

function updateProtocolAndFinancialSwapVolume(event: ethereum.Event, swap: Swap): void {
  let protocol = getOrCreateDexAmm();
  let swapVolumetUsd = calculateSwapVolume(swap);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(swapVolumetUsd);
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(swapVolumetUsd);
  financialMetrics.save();
  updateFinancials(event);
}

function updatePoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let pool = getOrCreateLiquidityPool(event.address);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(calculateSwapVolume(swap));
  pool.save();
}

export function updateBalancesInPoolAfterSwap(event: ethereum.Event, swap: Swap): void {
  let pool = getOrCreateLiquidityPool(event.address);
  let balances: BigInt[] = pool.inputTokenBalances;

  for (let i = 0; i < pool.inputTokens.length; i++) {
    // log.debug("trying to match {} with swap input token {}", [pool.inputTokens[i], swap.tokenIn]);
    if (pool.inputTokens[i] == swap.tokenIn) {
      // log.debug("match found {} with input {}", [pool.inputTokens[i], swap.tokenIn]);
      balances[i] = balances[i].plus(swap.amountIn);
    }
    // log.debug("trying to match {} with swap input token {}", [pool.inputTokens[i], swap.tokenOut]);
    if (pool.inputTokens[i] == swap.tokenOut) {
      // log.debug("match found {} with input {}", [pool.inputTokens[i], swap.tokenOut]);
      balances[i] = balances[i].minus(swap.amountIn);
    }
  }

  pool.save();
}

function updateHourlyPoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let snapshot = getOrCreateLiquidityPoolHourlySnapshot(event);

  let hourlyVolumeByTokenUSD: BigDecimal[] = snapshot.hourlyVolumeByTokenUSD;
  let hourlyVolumeByTokenAmount: BigInt[] = snapshot.hourlyVolumeByTokenAmount;
  log.debug("{}, {}", [hourlyVolumeByTokenAmount.toString(), hourlyVolumeByTokenUSD.toString()]);
  for (let i = 0; i < snapshot.inputTokens.length; i++) {
    // log.debug("trying to match {} with swap input token {}", [snapshot.inputTokens[i], swap.tokenIn]);
    if (snapshot.inputTokens[i] == swap.tokenIn) {
      // log.debug("match found {} with input {}", [snapshot.inputTokens[i], swap.tokenIn]);
      hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].plus(swap.amountInUSD);
      hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].plus(swap.amountIn);
    }
    // log.debug("trying to match {} with swap input token {}", [snapshot.inputTokens[i], swap.tokenOut]);
    if (snapshot.inputTokens[i] == swap.tokenOut) {
      // log.debug("match found {} with input {}", [snapshot.inputTokens[i], swap.tokenOut]);
      hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].plus(swap.amountOutUSD);
      hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].plus(swap.amountOut);
    }
  }
  snapshot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  snapshot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  snapshot.hourlyVolumeUSD = snapshot.hourlyVolumeUSD.plus(calculateSwapVolume(swap));

  snapshot.save();
}

function updateDailyPoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let snapshot = getOrCreateLiquidityPoolDailySnapshot(event);

  let dailyVolumeByTokenUSD: BigDecimal[] = snapshot.dailyVolumeByTokenUSD;
  let dailyVolumeByTokenAmount: BigInt[] = snapshot.dailyVolumeByTokenAmount;
  log.debug("{}, {}", [dailyVolumeByTokenUSD.toString(), dailyVolumeByTokenAmount.toString()]);
  for (let i = 0; i < snapshot.inputTokens.length; i++) {
    // log.debug("trying to match {} with swap input token {}", [snapshot.inputTokens[i], swap.tokenIn]);
    if (snapshot.inputTokens[i] == swap.tokenIn) {
      // log.debug("match found {} with input {}", [snapshot.inputTokens[i], swap.tokenIn]);
      dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].plus(swap.amountInUSD);
      dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].plus(swap.amountIn);
    }
    // log.debug("trying to match {} with swap input token {}", [snapshot.inputTokens[i], swap.tokenOut]);
    if (snapshot.inputTokens[i] == swap.tokenOut) {
      // log.debug("match found {} with input {}", [snapshot.inputTokens[i], swap.tokenOut]);
      dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].plus(swap.amountOutUSD);
      dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].plus(swap.amountOut);
    }
  }
  snapshot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  snapshot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  snapshot.dailyVolumeUSD = snapshot.dailyVolumeUSD.plus(calculateSwapVolume(swap));

  snapshot.save();
}

function updateSwapTradingVolumes(event: ethereum.Event, swap: Swap): void {
  updateProtocolAndFinancialSwapVolume(event, swap);
  updatePoolSwapVolume(event, swap);
  updatePoolMetrics(event);
  updateHourlyPoolSwapVolume(event, swap);
  updateDailyPoolSwapVolume(event, swap);
}

export function updateSwapMetrics(event: ethereum.Event, swap: Swap): void {
  updateBalancesInPoolAfterSwap(event, swap);
  updateProtocolTVL(event);
  updateSwapTradingVolumes(event, swap);
}
