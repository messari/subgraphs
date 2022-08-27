import { Address } from "@graphprotocol/graph-ts";

import {
  getOrCreateProtocol,
  getOrCreatePool,
  getOrCreateToken,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
} from "../../../common/getters";
import { bigIntToBigDecimal } from "../../../common/utils/numbers";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";

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
