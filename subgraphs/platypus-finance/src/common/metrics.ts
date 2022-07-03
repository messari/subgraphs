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
import { BIGDECIMAL_TWO, BIGDECIMAL_ZERO, TransactionType } from "./constants";
import { exponentToBigDecimal, tokenAmountToUSDAmount } from "./utils/numbers";

export function updateProtocolTVL(event: ethereum.Event): void {
  log.debug("[UpdateTVL][{}] get protocol", [event.transaction.hash.toHexString()]);
  let protocol = getOrCreateDexAmm();
  let protocolLockedValue = BIGDECIMAL_ZERO;
  let totalPoolCount = 0;

  // loop through each pool and update total value locked in USD for protocol and each pool
  for (let i = 0; i < protocol.pools.length; i++) {
    let poolLockedValue = BIGDECIMAL_ZERO;
    let pool = getOrCreateLiquidityPool(Address.fromString(protocol.pools[i]), event);
    let inputTokenBalances = pool.inputTokenBalances;

    log.debug("[UpdateTVL][{}] get pool {} {}", [
      event.transaction.hash.toHexString(),
      i.toString(),
      protocol.pools[i],
    ]);

    if (!pool._ignore) {
      totalPoolCount = totalPoolCount + 1;
      for (let j = 0; j < pool._assets.length; j++) {
        let _asset = _Asset.load(pool._assets[j])!;

        let token = getOrCreateToken(event, Address.fromString(_asset.token));
        let usdValue = tokenAmountToUSDAmount(token, _asset.cash);
        log.debug("[UpdateTVL][{}] get asset {} {} for pool {} tvl => pool={}+asset={}", [
          event.transaction.hash.toHexString(),
          j.toString(),
          pool._assets[j],
          pool.id,
          poolLockedValue.toString(),
          usdValue.toString(),
        ]);

        poolLockedValue = poolLockedValue.plus(usdValue);
        inputTokenBalances[pool.inputTokens.indexOf(token.id)] = _asset.cash;
      }
    }

    log.debug("[UpdateTVL][{}] final pooltvl {} {} {}", [
      event.transaction.hash.toHexString(),
      i.toString(),
      pool.id,
      poolLockedValue.toString(),
    ]);

    pool.inputTokenBalances = inputTokenBalances;
    pool.totalValueLockedUSD = poolLockedValue;
    pool.save();

    protocolLockedValue = protocolLockedValue.plus(poolLockedValue);
  }

  log.debug("[UpdateTVL][{}] final protocoltvl {}", [
    event.transaction.hash.toHexString(),
    protocolLockedValue.toString(),
  ]);

  protocol.totalPoolCount = totalPoolCount;
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
  let hours = getHours(event.block.timestamp.toI64()).toString();
  let hourlyAccountId = "hourly-".concat(user.toHexString().concat("-").concat(hours));

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
  let days = getDays(event.block.timestamp.toI64()).toString();
  let dailyAccountId = "daily-".concat(user.toHexString().concat("-").concat(days));

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
  let pool = getOrCreateLiquidityPool(event.address, event);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot._assets = pool._assets;
  snapshot._inputTokens = pool.inputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot._stakedAssetsAmounts = pool._stakedAssetsAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

function updateDailyPoolMetrics(event: ethereum.Event): void {
  let snapshot = getOrCreateLiquidityPoolDailySnapshot(event);
  let pool = getOrCreateLiquidityPool(event.address, event);

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot._assets = pool._assets;
  snapshot._inputTokens = pool.inputTokens;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot._stakedAssetsAmounts = pool._stakedAssetsAmounts;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.save();
}

export function calculateSwapVolume(swap: Swap): BigDecimal {
  return swap.amountInUSD.plus(swap.amountOutUSD).div(BIGDECIMAL_TWO);
}

export function calculateSwapFeeInTokenAmount(event: ethereum.Event, poolAddress: Address, swap: Swap): BigDecimal {
  // Fee calculation
  // feeInTokenAmount = (haircut_rate * actual_amount) / (1 - haircut_rate)
  let poolMetrics = getOrCreateLiquidityPoolParamsHelper(event, poolAddress);
  let haircutRate = poolMetrics.HaircutRate.div(exponentToBigDecimal(18));
  let n: BigDecimal = haircutRate.times(swap.amountOut.toBigDecimal());
  let d: BigDecimal = BigDecimal.fromString("1").minus(haircutRate);
  return n.div(d);
}

export function calculateSwapFeeInUsd(event: ethereum.Event, poolAddress: Address, swap: Swap): BigDecimal {
  // Fee calculation
  // feeInTokenUsd = feeInTokenAmount * outputLPTokenPrice / feeInTokenAmount * outputTokenPrice? Assuming latter in current implementation
  let feeInTokenAmount = calculateSwapFeeInTokenAmount(event, poolAddress, swap);
  let feeToken = getOrCreateToken(event, Address.fromString(swap.tokenOut));
  return tokenAmountToUSDAmount(feeToken, BigInt.fromString(feeInTokenAmount.toString().split(".")[0]));
}

function updateCumulativeSwapVolume(event: ethereum.Event, swap: Swap): void {
  let swapVolumeUsd = calculateSwapVolume(swap);

  let pool = getOrCreateLiquidityPool(event.address, event);
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

  let indexIn = snapshot._inputTokens!.indexOf(swap.tokenIn);

  hourlyVolumeByTokenUSD[indexIn] = hourlyVolumeByTokenUSD[indexIn].plus(swap.amountInUSD);
  hourlyVolumeByTokenAmount[indexIn] = hourlyVolumeByTokenAmount[indexIn].plus(swap.amountIn);

  let indexOut = snapshot._inputTokens!.indexOf(swap.tokenOut);
  hourlyVolumeByTokenUSD[indexOut] = hourlyVolumeByTokenUSD[indexOut].plus(swap.amountOutUSD);
  hourlyVolumeByTokenAmount[indexOut] = hourlyVolumeByTokenAmount[indexOut].plus(swap.amountOut);

  snapshot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  snapshot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  snapshot.hourlyVolumeUSD = snapshot.hourlyVolumeUSD.plus(calculateSwapVolume(swap));

  snapshot.save();
}

function updateDailyPoolSwapVolume(event: ethereum.Event, swap: Swap): void {
  let snapshot = getOrCreateLiquidityPoolDailySnapshot(event);

  let dailyVolumeByTokenUSD: BigDecimal[] = snapshot.dailyVolumeByTokenUSD;
  let dailyVolumeByTokenAmount: BigInt[] = snapshot.dailyVolumeByTokenAmount;

  let indexIn = snapshot._inputTokens!.indexOf(swap.tokenIn);

  dailyVolumeByTokenUSD[indexIn] = dailyVolumeByTokenUSD[indexIn].plus(swap.amountInUSD);
  dailyVolumeByTokenAmount[indexIn] = dailyVolumeByTokenAmount[indexIn].plus(swap.amountIn);

  let indexOut = snapshot._inputTokens!.indexOf(swap.tokenOut);
  dailyVolumeByTokenUSD[indexOut] = dailyVolumeByTokenUSD[indexOut].plus(swap.amountOutUSD);
  dailyVolumeByTokenAmount[indexOut] = dailyVolumeByTokenAmount[indexOut].plus(swap.amountOut);

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
  let poolMetrics = getOrCreateLiquidityPoolParamsHelper(event, poolAddress);
  let swapFeeUsd = calculateSwapFeeInUsd(event, poolAddress, swap);
  let supplySideFee = exponentToBigDecimal(18).minus(poolMetrics.RetentionRatio).times(swapFeeUsd);
  let protocolSideFee = swapFeeUsd.minus(supplySideFee);
  updateFinancialSnapshotFeeMetrics(event, supplySideFee, protocolSideFee);
  updatePoolFeeMetrics(event, supplySideFee, protocolSideFee);
}

function updateFinancialSnapshotFeeMetrics(
  event: ethereum.Event,
  supplySideFee: BigDecimal,
  protocolSideFee: BigDecimal,
): void {
  let protocol = getOrCreateDexAmm();
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplySideFee);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideFee);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    protocol.cumulativeProtocolSideRevenueUSD,
  );
  protocol.protocolControlledValueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  protocol.save();

  let snapshot = getOrCreateFinancialsDailySnapshot(event);
  snapshot.dailySupplySideRevenueUSD = snapshot.dailySupplySideRevenueUSD.plus(supplySideFee);
  snapshot.dailyProtocolSideRevenueUSD = snapshot.dailyProtocolSideRevenueUSD.plus(protocolSideFee);
  snapshot.dailyTotalRevenueUSD = snapshot.dailySupplySideRevenueUSD.plus(snapshot.dailyProtocolSideRevenueUSD);
  snapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.protocolControlledValueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.save();
}

function updatePoolFeeMetrics(event: ethereum.Event, supplySideFee: BigDecimal, protocolSideFee: BigDecimal): void {
  let pool = getOrCreateLiquidityPool(event.address, event);
  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(supplySideFee);
  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(protocolSideFee);
  pool.cumulativeTotalRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(pool.cumulativeProtocolSideRevenueUSD);
  pool.save();

  let hourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(event);
  hourlySnapshot.hourlySupplySideRevenueUSD = hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideFee);
  hourlySnapshot.hourlyProtocolSideRevenueUSD = hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideFee);
  hourlySnapshot.hourlyTotalRevenueUSD = hourlySnapshot.hourlySupplySideRevenueUSD.plus(
    hourlySnapshot.hourlyProtocolSideRevenueUSD,
  );
  hourlySnapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  hourlySnapshot.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
  hourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  hourlySnapshot.save();

  let dailySnapshot = getOrCreateLiquidityPoolDailySnapshot(event);
  dailySnapshot.dailySupplySideRevenueUSD = dailySnapshot.dailySupplySideRevenueUSD.plus(supplySideFee);
  dailySnapshot.dailyProtocolSideRevenueUSD = dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideFee);
  dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailySupplySideRevenueUSD.plus(
    dailySnapshot.dailyProtocolSideRevenueUSD,
  );
  dailySnapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  dailySnapshot.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
  dailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  dailySnapshot.save();
}
