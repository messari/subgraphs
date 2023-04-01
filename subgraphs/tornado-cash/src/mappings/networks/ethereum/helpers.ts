import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import {
  getOrCreateProtocol,
  getOrCreatePool,
  getOrCreateToken,
} from "../../../common/getters";
import {
  bigIntToBigDecimal,
  bigDecimalToBigInt,
} from "../../../common/utils/numbers";
import { getRewardsPerDay, RewardIntervalType } from "../../../common/rewards";
import { BIGDECIMAL_ZERO } from "../../../common/constants";
import { updatePoolMetrics, updateRevenue } from "../../../common/metrics";
import { NetworkConfigs } from "../../../../configurations/configure";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";
import { FeeUpdated } from "../../../../generated/TornadoCashFeeManager/TornadoCashFeeManager";
import { RateChanged } from "../../../../generated/TornadoCashMiner/TornadoCashMiner";
import { Swap } from "../../../../generated/TornadoCashRewardSwap/TornadoCashRewardSwap";

export function createDeposit(poolAddress: string, event: Deposit): void {
  const pool = getOrCreatePool(poolAddress, event);
  const inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(pool._denomination),
  ];

  const inputTokenbalanceUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.inputTokenBalancesUSD = [inputTokenbalanceUSD];
  pool.totalValueLockedUSD = inputTokenbalanceUSD;
  pool.save();
}

export function createWithdrawal(poolAddress: string, event: Withdrawal): void {
  const pool = getOrCreatePool(poolAddress, event);
  const inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(pool._denomination),
  ];

  const inputTokenBalanceUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.inputTokenBalancesUSD = [inputTokenBalanceUSD];
  pool.totalValueLockedUSD = inputTokenBalanceUSD;
  pool.save();

  const relayerFeeUsd = bigIntToBigDecimal(
    event.params.fee,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  if (relayerFeeUsd != BIGDECIMAL_ZERO) {
    const protocolFeeToken = getOrCreateToken(
      Address.fromString(NetworkConfigs.getRewardToken().get("address")!),
      event.block.number
    );

    const protocolFeeUsd = bigIntToBigDecimal(
      pool._fee,
      protocolFeeToken.decimals
    ).times(protocolFeeToken.lastPriceUSD!);

    updateRevenue(event, poolAddress, relayerFeeUsd, protocolFeeUsd);
  }
}

export function createFeeUpdated(poolAddress: string, event: FeeUpdated): void {
  const pool = getOrCreatePool(poolAddress, event);

  pool._fee = event.params.newFee;
  pool.save();
}

export function createRateChanged(
  poolAddress: string,
  event: RateChanged
): void {
  const pool = getOrCreatePool(poolAddress, event);

  pool._apEmissionsAmount = [event.params.value];
  pool.save();
}

export function createRewardSwap(event: Swap): void {
  const protocol = getOrCreateProtocol();

  const rewardToken = getOrCreateToken(
    Address.fromString(NetworkConfigs.getRewardToken().get("address")!),
    event.block.number
  );

  const pools = protocol.pools;
  for (let i = 0; i < pools.length; i++) {
    const pool = getOrCreatePool(pools[i], event);

    const rewardsPerBlock = event.params.TORN.div(event.params.pTORN).times(
      pool._apEmissionsAmount![0]
    );
    const rewardsPerDay = getRewardsPerDay(
      event.block.timestamp,
      event.block.number,
      new BigDecimal(rewardsPerBlock),
      RewardIntervalType.BLOCK
    );

    pool.rewardTokenEmissionsAmount = [bigDecimalToBigInt(rewardsPerDay)];
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
