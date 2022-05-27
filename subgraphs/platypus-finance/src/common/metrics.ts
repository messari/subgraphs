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
    let inputTokenBalances = pool.inputTokenBalances;

    for (let i = 0; i < pool._assets.length; i++) {
      let _asset = _Asset.load(pool._assets[i])!;
      let token = getOrCreateToken(event, Address.fromString(_asset.token));
      let usdValue = bigIntToBigDecimal(_asset.cash, token.decimals);
      poolLockedValue = poolLockedValue.plus(usdValue);

      let _index = pool.inputTokens.sort().indexOf(token.id);
      _asset._index = BigInt.fromI32(_index);
      _asset.save();
      inputTokenBalances[_index] = _asset.cash;
    }

    pool.inputTokenBalances = inputTokenBalances;
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

function updateCumulativeSwapVolume(event: ethereum.Event, swap: Swap): void {
  let swapVolumeUsd = calculateSwapVolume(swap);

  let pool = getOrCreateLiquidityPool(event.address);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(swapVolumeUsd);
  pool.save();

  let protocol = getOrCreateDexAmm();
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(swapVolumeUsd);
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(swapVolumeUsd);
  financialMetrics.save();
}

function updateHourlyPoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let snapshot = getOrCreateLiquidityPoolHourlySnapshot(event);

  let hourlyVolumeByTokenUSD: BigDecimal[] = snapshot.hourlyVolumeByTokenUSD;
  let hourlyVolumeByTokenAmount: BigInt[] = snapshot.hourlyVolumeByTokenAmount;

  for (let i = 0; i < snapshot._inputTokens!.length; i++) {
    let token = snapshot._inputTokens![i];

    if (token == swap.tokenIn || token == swap.tokenOut) {
      hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].plus(swap.amountInUSD);
      hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].plus(swap.amountIn);
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

  for (let i = 0; i < snapshot._inputTokens!.length; i++) {
    let token = snapshot._inputTokens![i];

    if (token == swap.tokenIn || token == swap.tokenOut) {
      dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].plus(swap.amountInUSD);
      dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].plus(swap.amountIn);
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

export function updateSwapMetrics(event: ethereum.Event, swap: Swap): void {
  updateCumulativeSwapVolume(event, swap);
  updateHourlyPoolSwapVolume(event, swap);
  updateDailyPoolSwapVolume(event, swap);
}

export function updateFeeMetrics(event: ethereum.Event, poolAddress: Address, swap: Swap): void {
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
