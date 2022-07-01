import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV3TraderJoe } from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { getOrCreateToken } from "../../../../../src/common/getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../../../../src/price/price";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../helpers";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import { convertTokenToDecimal } from "../../../../../src/common/utils/utils";

export function updateMasterChefDeposit(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV3Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MasterChefV3TraderJoe.bind(event.address);
  let masterChefV3 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  let pool = LiquidityPool.load(masterChefV3Pool.poolAddress);
  if (!pool) {
    return;
  }

  if (masterChefV3.lastUpdatedRewardRate != event.block.number) {
    masterChefV3.adjustedRewardTokenRate = masterchefV2Contract.joePerSec();
    masterChefV3.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  let rewardAmountPerInterval = masterChefV3.adjustedRewardTokenRate
    .times(masterChefV3Pool.poolAllocPoint)
    .div(masterChefV3.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV3.rewardTokenInterval
  );

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(rewardTokenPerDay.toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefV3Pool.lastRewardBlock = event.block.number;

  masterChefV3Pool.save();
  masterChefV3.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

export function updateMasterChefWithdraw(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MasterChefV3TraderJoe.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress);
  if (!pool) {
    return;
  }

  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    masterChefV2.adjustedRewardTokenRate = masterchefV2Contract.joePerSec();
    masterChefV2.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
    .times(masterChefV2Pool.poolAllocPoint)
    .div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV2.rewardTokenInterval
  );

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(rewardTokenPerDay.toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}
