import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";

import {
  getOrCreateProtocol,
  getOrCreatePool,
  getOrCreateToken,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
} from "../../../common/getters";
import {
  bigIntToBigDecimal,
  roundToWholeNumber,
} from "../../../common/utils/numbers";
import { getRewardsPerDay, RewardIntervalType } from "../../../common/rewards";
import { TORN_ADDRESS } from "../../../common/constants";
import { updatePoolMetrics } from "../../../common/metrics";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";
import { FeeUpdated } from "../../../../generated/TornadoCashFeeManager/TornadoCashFeeManager";
import { RateChanged } from "../../../../generated/TornadoCashMiner/TornadoCashMiner";
import { Swap } from "../../../../generated/TornadoCashRewardSwap/TornadoCashRewardSwap";

export function createDeposit(poolAddress: string, event: Deposit): void {
  let pool = getOrCreatePool(poolAddress, event);
  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(pool._denomination),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.save();

  let depositValueUsd = bigIntToBigDecimal(
    pool._denomination,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  let protocol = getOrCreateProtocol();

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    depositValueUsd
  );
  protocol.save();
}

export function createWithdrawal(poolAddress: string, event: Withdrawal): void {
  let pool = getOrCreatePool(poolAddress, event);
  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  let relayerFeeUsd = bigIntToBigDecimal(
    event.params.fee,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  let protocolFeeUsd = bigIntToBigDecimal(pool._fee, inputToken.decimals).times(
    inputToken.lastPriceUSD!
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(pool._denomination),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(
    relayerFeeUsd
  );
  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(
    protocolFeeUsd
  );
  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(
    pool.cumulativeTotalRevenueUSD.minus(pool.cumulativeProtocolSideRevenueUSD)
  );
  pool.save();

  let poolMetricsDaily = getOrCreatePoolDailySnapshot(event);

  poolMetricsDaily.dailyTotalRevenueUSD = poolMetricsDaily.dailyTotalRevenueUSD.plus(
    relayerFeeUsd
  );
  poolMetricsDaily.dailyProtocolSideRevenueUSD = poolMetricsDaily.dailyProtocolSideRevenueUSD.plus(
    protocolFeeUsd
  );
  poolMetricsDaily.dailySupplySideRevenueUSD = poolMetricsDaily.dailyTotalRevenueUSD.minus(
    poolMetricsDaily.dailyProtocolSideRevenueUSD
  );
  poolMetricsDaily.save();

  let poolMetricsHourly = getOrCreatePoolHourlySnapshot(event);

  poolMetricsHourly.hourlyTotalRevenueUSD = poolMetricsHourly.hourlyTotalRevenueUSD.plus(
    relayerFeeUsd
  );
  poolMetricsHourly.hourlyProtocolSideRevenueUSD = poolMetricsHourly.hourlyProtocolSideRevenueUSD.plus(
    protocolFeeUsd
  );
  poolMetricsHourly.hourlySupplySideRevenueUSD = poolMetricsHourly.hourlyTotalRevenueUSD.minus(
    poolMetricsHourly.hourlyProtocolSideRevenueUSD
  );
  poolMetricsHourly.save();

  let withdrawValueUsd = bigIntToBigDecimal(
    pool._denomination,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  let protocol = getOrCreateProtocol();

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    withdrawValueUsd
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    relayerFeeUsd
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolFeeUsd
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    pool.cumulativeTotalRevenueUSD.minus(pool.cumulativeProtocolSideRevenueUSD)
  );
  protocol.save();

  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  financialMetricsDaily.dailyTotalRevenueUSD = financialMetricsDaily.dailyTotalRevenueUSD.plus(
    relayerFeeUsd
  );
  financialMetricsDaily.dailyProtocolSideRevenueUSD = financialMetricsDaily.dailyProtocolSideRevenueUSD.plus(
    protocolFeeUsd
  );
  financialMetricsDaily.dailySupplySideRevenueUSD = financialMetricsDaily.dailyTotalRevenueUSD.minus(
    financialMetricsDaily.dailyProtocolSideRevenueUSD
  );
  financialMetricsDaily.save();
}

export function createFeeUpdated(poolAddress: string, event: FeeUpdated): void {
  let pool = getOrCreatePool(poolAddress, event);

  pool._fee = event.params.newFee;
  pool.save();
}

export function createRateChanged(
  poolAddress: string,
  event: RateChanged
): void {
  let pool = getOrCreatePool(poolAddress, event);

  let network = dataSource.network().toUpperCase();
  let rewardToken = getOrCreateToken(
    TORN_ADDRESS.get(network)!,
    event.block.number
  );

  let rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    bigIntToBigDecimal(event.params.value, rewardToken.decimals),
    RewardIntervalType.BLOCK
  );

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardsPerDay).toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    bigIntToBigDecimal(
      pool.rewardTokenEmissionsAmount![0],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];
  pool.save();
}

export function createRewardSwap(event: Swap): void {
  let protocol = getOrCreateProtocol();

  let network = dataSource.network().toUpperCase();
  let rewardToken = getOrCreateToken(
    TORN_ADDRESS.get(network)!,
    event.block.number
  );

  let pools = protocol.pools;
  for (let i = 0; i < pools.length; i++) {
    let pool = getOrCreatePool(pools[i], event);

    pool.rewardTokenEmissionsUSD = [
      bigIntToBigDecimal(
        pool.rewardTokenEmissionsAmount![0],
        rewardToken.decimals
      ).times(rewardToken.lastPriceUSD!),
    ];
    pool.save();

    updatePoolMetrics(pools[i], event);
  }
}
