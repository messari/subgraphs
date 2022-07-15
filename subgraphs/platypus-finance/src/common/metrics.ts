import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _Asset, Account, ActiveAccount, Swap, LiquidityPool } from "../../generated/schema";
import {
  getOrCreateAssetPool,
  getOrCreateDailyUsageMetricSnapshot,
  getOrCreateDexAmm,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateHourlyUsageMetricSnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateLiquidityPoolParamsHelper,
  getOrCreateToken,
} from "../common/getters";
import { getDays, getHours } from "../common/utils/datetime";
import { BIGDECIMAL_TWO, BIGDECIMAL_ZERO, TransactionType, ZERO_ADDRESS } from "./constants";
import { exponentToBigDecimal, tokenAmountToUSDAmount } from "./utils/numbers";

function updatePoolTVL(
  event: ethereum.Event,
  assetAddress: Address,
  protocolLockedValue: BigDecimal,
  updateValue: bool,
): BigDecimal {
  let pool = LiquidityPool.load(assetAddress.toHexString())!;
  if (!pool._ignore) {
    if (updateValue) {
      protocolLockedValue = protocolLockedValue.minus(pool.totalValueLockedUSD);
    }

    let _asset = _Asset.load(assetAddress.toHexString())!;
    let token = getOrCreateToken(event, Address.fromString(_asset.token));

    pool.inputTokenBalances = [_asset.cash];
    pool.totalValueLockedUSD = tokenAmountToUSDAmount(token, _asset.cash);
    pool.save();

    protocolLockedValue = protocolLockedValue.plus(pool.totalValueLockedUSD);
  }
  return protocolLockedValue;
}

export function updateProtocolTVL(event: ethereum.Event, assetAddress: Address): void {
  let protocol = getOrCreateDexAmm();
  let protocolLockedValue = protocol.totalValueLockedUSD;

  if (!assetAddress.equals(ZERO_ADDRESS)) {
    protocolLockedValue = updatePoolTVL(event, assetAddress, protocolLockedValue, true);
  } else {
    protocolLockedValue = BIGDECIMAL_ZERO;
    for (let i = 0; i < protocol.pools.length; i++) {
      protocolLockedValue = updatePoolTVL(event, Address.fromString(protocol.pools[i]), protocolLockedValue, false);
    }
  }

  protocol.totalValueLockedUSD = protocolLockedValue;
  protocol.save();
}

// updates the Financials of the day except revenues, which will be handled in swaps
export function updateFinancials(event: ethereum.Event): void {
  let protocol = getOrCreateDexAmm();
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;

  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, user: Address, transactionType: TransactionType): void {
  let protocol = getOrCreateDexAmm();
  let hourlyUsageSnapshot = getOrCreateHourlyUsageMetricSnapshot(event);
  let dailyUsageSnapshot = getOrCreateDailyUsageMetricSnapshot(event);

  let account = Account.load(user.toHexString());
  if (!account) {
    account = new Account(user.toHexString());
    account.save();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  let hours = getHours(event.block.timestamp.toI64()).toString();
  let hourlyAccountId = "hourly-".concat(user.toHexString().concat("-").concat(hours));
  let hourlyAccount = ActiveAccount.load(hourlyAccountId.toString());

  if (!hourlyAccount) {
    hourlyAccount = new ActiveAccount(hourlyAccountId);
    hourlyAccount.save();
    hourlyUsageSnapshot.hourlyActiveUsers += 1;
  }

  let days = getDays(event.block.timestamp.toI64()).toString();
  let dailyAccountId = "daily-".concat(user.toHexString().concat("-").concat(days));
  let dailyAccount = ActiveAccount.load(dailyAccountId);

  if (!dailyAccount) {
    dailyAccount = new ActiveAccount(dailyAccountId);
    dailyAccount.save();
    dailyUsageSnapshot.dailyActiveUsers += 1;
  }

  hourlyUsageSnapshot.blockNumber = event.block.number;
  hourlyUsageSnapshot.timestamp = event.block.timestamp;
  hourlyUsageSnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlyUsageSnapshot.hourlyTransactionCount += 1;

  dailyUsageSnapshot.blockNumber = event.block.number;
  dailyUsageSnapshot.timestamp = event.block.timestamp;
  dailyUsageSnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyUsageSnapshot.dailyTransactionCount += 1;

  switch (transactionType) {
    case TransactionType.DEPOSIT:
      hourlyUsageSnapshot.hourlyDepositCount += 1;
      dailyUsageSnapshot.dailyDepositCount += 1;
      break;
    case TransactionType.WITHDRAW:
      hourlyUsageSnapshot.hourlyWithdrawCount += 1;
      dailyUsageSnapshot.dailyWithdrawCount += 1;
      break;
    case TransactionType.SWAP:
      hourlyUsageSnapshot.hourlySwapCount += 1;
      dailyUsageSnapshot.dailySwapCount += 1;
      break;
  }

  hourlyUsageSnapshot.save();
  dailyUsageSnapshot.save();
}

export function updatePoolMetrics(event: ethereum.Event, assetAddress: Address, tokenAddress: Address): void {
  let pool = getOrCreateAssetPool(event, assetAddress, event.address, tokenAddress);
  let hourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(event, assetAddress, event.address, tokenAddress);
  let dailySnapshot = getOrCreateLiquidityPoolDailySnapshot(event, assetAddress, event.address, tokenAddress);

  hourlySnapshot.blockNumber = event.block.number;
  hourlySnapshot.timestamp = event.block.timestamp;
  hourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  hourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  hourlySnapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  hourlySnapshot.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
  hourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  hourlySnapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  hourlySnapshot.outputTokenSupply = pool.outputTokenSupply;
  hourlySnapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  hourlySnapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  hourlySnapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  hourlySnapshot.save();

  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;
  dailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  dailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  dailySnapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  dailySnapshot.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
  dailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  dailySnapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  dailySnapshot.outputTokenSupply = pool.outputTokenSupply;
  dailySnapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  dailySnapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  dailySnapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  dailySnapshot.save();
}

function calculateSwapVolume(swap: Swap): BigDecimal {
  return swap.amountInUSD.plus(swap.amountOutUSD).div(BIGDECIMAL_TWO);
}

function calculateSwapFeeInTokenAmount(event: ethereum.Event, swap: Swap, haircutRate: BigDecimal): BigDecimal {
  // Fee calculation
  // feeInTokenAmount = (haircut_rate * actual_amount) / (1 - haircut_rate)
  haircutRate = haircutRate.div(exponentToBigDecimal(18));
  let n: BigDecimal = haircutRate.times(swap.amountOut.toBigDecimal());
  let d: BigDecimal = BigDecimal.fromString("1").minus(haircutRate);
  return n.div(d);
}

function calculateSwapFeeInUsd(event: ethereum.Event, swap: Swap, haircutRate: BigDecimal): BigDecimal {
  // Fee calculation
  // feeInTokenUsd = feeInTokenAmount * outputLPTokenPrice / feeInTokenAmount * outputTokenPrice? Assuming latter in current implementation
  let feeInTokenAmount = calculateSwapFeeInTokenAmount(event, swap, haircutRate);
  let feeToken = getOrCreateToken(event, Address.fromString(swap.tokenOut));
  let amountUsd = tokenAmountToUSDAmount(feeToken, BigInt.fromString(feeInTokenAmount.toString().split(".")[0]));
  return amountUsd;
}

export function updateMetricsAfterSwap(
  event: ethereum.Event,
  poolAddress: Address,
  fromAssetAddress: Address,
  toAssetAddress: Address,
  fromTokenAddress: Address,
  toTokenAddress: Address,
  fromTokenAmount: BigInt,
  actualToTokenAmount: BigInt,
  sender: Address,
  to: Address,
): void {
  let protocol = getOrCreateDexAmm();
  let fromPool = getOrCreateAssetPool(event, fromAssetAddress, event.address, fromTokenAddress);
  let toPool = getOrCreateAssetPool(event, toAssetAddress, event.address, toTokenAddress);

  // create swap entity for the transaction
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  let inputToken = getOrCreateToken(event, fromTokenAddress);
  let outputToken = getOrCreateToken(event, toTokenAddress);
  let amountInUsd = tokenAmountToUSDAmount(inputToken, fromTokenAmount);
  let amountOutUsd = tokenAmountToUSDAmount(outputToken, actualToTokenAmount);

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = to.toHexString();
  swap.pool = fromPool.id;
  swap.fromPool = fromPool.id;
  swap.toPool = toPool.id;
  swap.from = sender.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = inputToken.id;
  swap.amountIn = fromTokenAmount;
  swap.amountInUSD = amountInUsd;
  swap.tokenOut = outputToken.id;
  swap.amountOut = actualToTokenAmount;
  swap.amountOutUSD = amountOutUsd;
  swap.save();

  // swap fee metrics
  let poolMetrics = getOrCreateLiquidityPoolParamsHelper(event, poolAddress);
  let swapFeeUsd = calculateSwapFeeInUsd(event, swap, poolMetrics.HaircutRate);
  let supplySideFee = exponentToBigDecimal(18).minus(poolMetrics.RetentionRatio).times(swapFeeUsd);
  let protocolSideFee = swapFeeUsd.minus(supplySideFee);
  // swap volume metrics
  let swapVolumeUsd = calculateSwapVolume(swap);

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplySideFee);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideFee);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    protocol.cumulativeProtocolSideRevenueUSD,
  );
  protocol.protocolControlledValueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(swapVolumeUsd);
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  // block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  // swap fee metrics
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplySideFee);
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideFee);
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    financialMetrics.dailyProtocolSideRevenueUSD,
  );
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  // swap volume metrics
  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(swapVolumeUsd);
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.protocolControlledValueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  // tvl
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.save();

  // swap volume metrics
  fromPool.cumulativeVolumeUSD = fromPool.cumulativeVolumeUSD.plus(swap.amountInUSD);
  fromPool.save();

  // only updating swap fee for output asset pool
  toPool.cumulativeSupplySideRevenueUSD = toPool.cumulativeSupplySideRevenueUSD.plus(supplySideFee);
  toPool.cumulativeProtocolSideRevenueUSD = toPool.cumulativeProtocolSideRevenueUSD.plus(protocolSideFee);
  toPool.cumulativeTotalRevenueUSD = toPool.cumulativeSupplySideRevenueUSD.plus(
    toPool.cumulativeProtocolSideRevenueUSD,
  );
  // swap volume metrics
  toPool.cumulativeVolumeUSD = toPool.cumulativeVolumeUSD.plus(swap.amountOutUSD);
  toPool.save();

  let toPoolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    event,
    toAssetAddress,
    event.address,
    Address.fromString(swap.tokenOut),
  );
  // block number and timestamp
  toPoolHourlySnapshot.blockNumber = event.block.number;
  toPoolHourlySnapshot.timestamp = event.block.timestamp;
  // swap fee metrics
  toPoolHourlySnapshot.hourlySupplySideRevenueUSD = toPoolHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideFee);
  toPoolHourlySnapshot.hourlyProtocolSideRevenueUSD =
    toPoolHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideFee);
  toPoolHourlySnapshot.hourlyTotalRevenueUSD = toPoolHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    toPoolHourlySnapshot.hourlyProtocolSideRevenueUSD,
  );
  toPoolHourlySnapshot.cumulativeSupplySideRevenueUSD = toPool.cumulativeSupplySideRevenueUSD;
  toPoolHourlySnapshot.cumulativeProtocolSideRevenueUSD = toPool.cumulativeProtocolSideRevenueUSD;
  toPoolHourlySnapshot.cumulativeTotalRevenueUSD = toPool.cumulativeTotalRevenueUSD;
  // swap volume metrics
  toPoolHourlySnapshot.hourlyVolumeByTokenAmount = [
    toPoolHourlySnapshot.hourlyVolumeByTokenAmount[0].plus(swap.amountOut),
  ];
  toPoolHourlySnapshot.hourlyVolumeByTokenUSD = [
    toPoolHourlySnapshot.hourlyVolumeByTokenUSD[0].plus(swap.amountOutUSD),
  ];
  toPoolHourlySnapshot.hourlyVolumeUSD = toPoolHourlySnapshot.hourlyVolumeUSD.plus(swap.amountOutUSD);
  toPoolHourlySnapshot.cumulativeVolumeUSD = toPool.cumulativeVolumeUSD;
  // copy rest from pool
  toPoolHourlySnapshot.inputTokenBalances = toPool.inputTokenBalances;
  toPoolHourlySnapshot.totalValueLockedUSD = toPool.totalValueLockedUSD;
  toPoolHourlySnapshot.outputTokenSupply = toPool.outputTokenSupply;
  toPoolHourlySnapshot.stakedOutputTokenAmount = toPool.stakedOutputTokenAmount;
  toPoolHourlySnapshot.rewardTokenEmissionsAmount = toPool.rewardTokenEmissionsAmount;
  toPoolHourlySnapshot.rewardTokenEmissionsUSD = toPool.rewardTokenEmissionsUSD;
  toPoolHourlySnapshot.save();

  let toPoolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    event,
    toAssetAddress,
    event.address,
    Address.fromString(swap.tokenOut),
  );
  // block number and timestamp
  toPoolDailySnapshot.blockNumber = event.block.number;
  toPoolDailySnapshot.timestamp = event.block.timestamp;
  // swap fee metrics
  toPoolDailySnapshot.dailySupplySideRevenueUSD = toPoolDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideFee);
  toPoolDailySnapshot.dailyProtocolSideRevenueUSD =
    toPoolDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideFee);
  toPoolDailySnapshot.dailyTotalRevenueUSD = toPoolDailySnapshot.dailySupplySideRevenueUSD.plus(
    toPoolDailySnapshot.dailyProtocolSideRevenueUSD,
  );
  toPoolDailySnapshot.cumulativeSupplySideRevenueUSD = toPool.cumulativeSupplySideRevenueUSD;
  toPoolDailySnapshot.cumulativeProtocolSideRevenueUSD = toPool.cumulativeProtocolSideRevenueUSD;
  toPoolDailySnapshot.cumulativeTotalRevenueUSD = toPool.cumulativeTotalRevenueUSD;
  // swap volume metrics
  toPoolDailySnapshot.dailyVolumeByTokenAmount = [toPoolDailySnapshot.dailyVolumeByTokenAmount[0].plus(swap.amountOut)];
  toPoolDailySnapshot.dailyVolumeByTokenUSD = [toPoolDailySnapshot.dailyVolumeByTokenUSD[0].plus(swap.amountOutUSD)];
  toPoolDailySnapshot.dailyVolumeUSD = toPoolDailySnapshot.dailyVolumeUSD.plus(swap.amountOutUSD);
  toPoolDailySnapshot.cumulativeVolumeUSD = toPool.cumulativeVolumeUSD;
  // copy rest from pool
  toPoolDailySnapshot.inputTokenBalances = toPool.inputTokenBalances;
  toPoolDailySnapshot.totalValueLockedUSD = toPool.totalValueLockedUSD;
  toPoolDailySnapshot.outputTokenSupply = toPool.outputTokenSupply;
  toPoolDailySnapshot.stakedOutputTokenAmount = toPool.stakedOutputTokenAmount;
  toPoolDailySnapshot.rewardTokenEmissionsAmount = toPool.rewardTokenEmissionsAmount;
  toPoolDailySnapshot.rewardTokenEmissionsUSD = toPool.rewardTokenEmissionsUSD;
  toPoolDailySnapshot.save();

  let fromPoolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    event,
    Address.fromString(swap.fromPool),
    event.address,
    Address.fromString(swap.tokenIn),
  );
  // block number and timestamp
  fromPoolHourlySnapshot.blockNumber = event.block.number;
  fromPoolHourlySnapshot.timestamp = event.block.timestamp;
  // swap volume metrics
  fromPoolHourlySnapshot.hourlyVolumeByTokenAmount = [
    fromPoolHourlySnapshot.hourlyVolumeByTokenAmount[0].plus(swap.amountIn),
  ];
  fromPoolHourlySnapshot.hourlyVolumeByTokenUSD = [
    fromPoolHourlySnapshot.hourlyVolumeByTokenUSD[0].plus(swap.amountInUSD),
  ];
  fromPoolHourlySnapshot.hourlyVolumeUSD = fromPoolHourlySnapshot.hourlyVolumeUSD.plus(swap.amountInUSD);
  fromPoolHourlySnapshot.cumulativeVolumeUSD = fromPool.cumulativeVolumeUSD;
  // copy rest from pool
  fromPoolHourlySnapshot.inputTokenBalances = fromPool.inputTokenBalances;
  fromPoolHourlySnapshot.totalValueLockedUSD = fromPool.totalValueLockedUSD;
  fromPoolHourlySnapshot.outputTokenSupply = fromPool.outputTokenSupply;
  fromPoolHourlySnapshot.stakedOutputTokenAmount = fromPool.stakedOutputTokenAmount;
  fromPoolHourlySnapshot.rewardTokenEmissionsAmount = fromPool.rewardTokenEmissionsAmount;
  fromPoolHourlySnapshot.rewardTokenEmissionsUSD = fromPool.rewardTokenEmissionsUSD;
  fromPoolHourlySnapshot.save();

  let fromPoolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    event,
    Address.fromString(swap.fromPool),
    event.address,
    Address.fromString(swap.tokenIn),
  );
  // block number and timestamp
  fromPoolDailySnapshot.blockNumber = event.block.number;
  fromPoolDailySnapshot.timestamp = event.block.timestamp;
  // swap volume metrics
  fromPoolDailySnapshot.dailyVolumeByTokenAmount = [
    fromPoolDailySnapshot.dailyVolumeByTokenAmount[0].plus(swap.amountIn),
  ];
  fromPoolDailySnapshot.dailyVolumeByTokenUSD = [fromPoolDailySnapshot.dailyVolumeByTokenUSD[0].plus(swap.amountInUSD)];
  fromPoolDailySnapshot.dailyVolumeUSD = fromPoolDailySnapshot.dailyVolumeUSD.plus(swap.amountInUSD);
  toPoolDailySnapshot.cumulativeVolumeUSD = fromPool.cumulativeVolumeUSD;
  // copy rest from pool
  toPoolDailySnapshot.inputTokenBalances = fromPool.inputTokenBalances;
  toPoolDailySnapshot.totalValueLockedUSD = fromPool.totalValueLockedUSD;
  toPoolDailySnapshot.outputTokenSupply = fromPool.outputTokenSupply;
  toPoolDailySnapshot.stakedOutputTokenAmount = fromPool.stakedOutputTokenAmount;
  toPoolDailySnapshot.rewardTokenEmissionsAmount = fromPool.rewardTokenEmissionsAmount;
  toPoolDailySnapshot.rewardTokenEmissionsUSD = fromPool.rewardTokenEmissionsUSD;
  fromPoolDailySnapshot.save();
}
