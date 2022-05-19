import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _Asset, Account, ActiveAccount, Swap } from "../../generated/schema";
import {
  getOrCreateDailyUsageMetricSnapshot,
  getOrCreateDexAmm,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateHourlyUsageMetricSnapshot,
  getOrCreateLiquidityPool,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateLiquidityPoolParamsHelper,
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

    for (let i = 0; i < pool._assets.length; i++) {
      let _asset = _Asset.load(pool._assets[i])!;
      let _index = _asset._index.toI32();
      let token = getOrCreateToken(event, Address.fromString(_asset.token));
      let usdValue = bigIntToBigDecimal(pool.inputTokenBalances[_index], token.decimals);
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
  snapshot._assets = pool._assets;
  snapshot._inputTokens = pool.inputTokens;
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
  snapshot._assets = pool._assets;
  snapshot._inputTokens = pool.inputTokens;
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

export function calculateSwapVolume(swap: Swap): BigDecimal {
  return swap.amountInUSD.plus(swap.amountOutUSD).div(BIGDECIMAL_TWO);
}

export function calculateSwapFeeInTokenAmount(poolAddress: Address, swap: Swap): BigDecimal {
  // Fee calculation
  // feeInTokenAmount = (haircut_rate * actual_amount) / (1 - haircut_rate)
  let poolMetrics = getOrCreateLiquidityPoolParamsHelper(poolAddress);
  let haircutRate = poolMetrics.HaircutRate.div(exponentToBigDecimal(18));
  let n: BigDecimal = haircutRate.times(swap.amountOut.toBigDecimal());
  let d: BigDecimal = BigDecimal.fromString("1").minus(haircutRate);
  return n.div(d);
}

export function calculateSwapFeeInUsd(event: ethereum.Event, poolAddress: Address, swap: Swap): BigDecimal {
  // Fee calculation
  // feeInTokenUsd = feeInTokenAmount * outputLPTokenPrice / feeInTokenAmount * outputTokenPrice? Assuming latter in current implementation
  let feeInTokenAmount = calculateSwapFeeInTokenAmount(poolAddress, swap);
  let feeToken = getOrCreateToken(event, Address.fromString(swap.tokenOut));
  return tokenAmountToUSDAmount(feeToken, BigInt.fromString(feeInTokenAmount.toString().split(".")[0]));
}

function updateProtocolAndFinancialSwapVolume(event: ethereum.Event, swap: Swap): void {
  let protocol = getOrCreateDexAmm();
  let swapVolumeUsd = calculateSwapVolume(swap);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(swapVolumeUsd);

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(swapVolumeUsd);

  protocol.save();
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

  for (let i = 0; i < pool._assets.length; i++) {
    let _asset = _Asset.load(pool._assets[i])!;
    let _index = _asset._index.toI32();
    let token = _asset.token;

    if (token == swap.tokenIn) {
      balances[_index] = balances[_index].plus(swap.amountIn);
    }
    if (token == swap.tokenOut) {
      balances[_index] = balances[_index].minus(swap.amountOut);
    }
  }

  pool.inputTokenBalances = balances;
  pool.save();
}

function updateHourlyPoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let snapshot = getOrCreateLiquidityPoolHourlySnapshot(event);

  let hourlyVolumeByTokenUSD: BigDecimal[] = snapshot.hourlyVolumeByTokenUSD;
  let hourlyVolumeByTokenAmount: BigInt[] = snapshot.hourlyVolumeByTokenAmount;

  for (let i = 0; i < snapshot._assets!.length; i++) {
    let _asset = _Asset.load(snapshot._assets![i])!;
    let _index = _asset._index.toI32();
    let token = _asset.token;

    if (token == swap.tokenIn) {
      hourlyVolumeByTokenUSD[_index] = hourlyVolumeByTokenUSD[_index].plus(swap.amountInUSD);
      hourlyVolumeByTokenAmount[_index] = hourlyVolumeByTokenAmount[_index].plus(swap.amountIn);
    }
    if (token == swap.tokenOut) {
      hourlyVolumeByTokenUSD[_index] = hourlyVolumeByTokenUSD[_index].plus(swap.amountOutUSD);
      hourlyVolumeByTokenAmount[_index] = hourlyVolumeByTokenAmount[_index].plus(swap.amountOut);
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

  for (let i = 0; i < snapshot._assets!.length; i++) {
    let _asset = _Asset.load(snapshot._assets![i])!;
    let _index = _asset._index.toI32();
    let token = _asset.token;

    if (token == swap.tokenIn) {
      dailyVolumeByTokenUSD[_index] = dailyVolumeByTokenUSD[_index].plus(swap.amountInUSD);
      dailyVolumeByTokenAmount[_index] = dailyVolumeByTokenAmount[_index].plus(swap.amountIn);
    }
    if (token == swap.tokenOut) {
      dailyVolumeByTokenUSD[_index] = dailyVolumeByTokenUSD[_index].plus(swap.amountOutUSD);
      dailyVolumeByTokenAmount[_index] = dailyVolumeByTokenAmount[_index].plus(swap.amountOut);
    }
  }

  
  snapshot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  snapshot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  snapshot.dailyVolumeUSD = snapshot.dailyVolumeUSD.plus(calculateSwapVolume(swap));

  snapshot.save();
}

export function updatePoolMetrics(event: ethereum.Event): void {
  updateHourlyPoolMetrics(event);
  updateDailyPoolMetrics(event);
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

function updateProtocolAndFinancialSwapFeeVolumes(event: ethereum.Event, poolAddress: Address, swap: Swap): void {
  let protocol = getOrCreateDexAmm();
  let swapFeeUsd = calculateSwapFeeInUsd(event, poolAddress, swap);

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(swapFeeUsd);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    protocol.cumulativeProtocolSideRevenueUSD,
  );
  protocol.save();

  let snapshot = getOrCreateFinancialsDailySnapshot(event);
  snapshot.dailySupplySideRevenueUSD = snapshot.dailySupplySideRevenueUSD.plus(swapFeeUsd);
  snapshot.dailyTotalRevenueUSD = snapshot.dailySupplySideRevenueUSD.plus(snapshot.dailyProtocolSideRevenueUSD);
  snapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.save();
}

export function updateFeeMetrics(event: ethereum.Event, poolAddress: Address, swap: Swap): void {
  updateProtocolAndFinancialSwapFeeVolumes(event, poolAddress, swap);
}
