import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MiniChefV2Apeswap } from "../../../../../generated/MiniChefV2/MiniChefV2Apeswap";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../../../../src/price/price";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../helpers";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";

export function updateMasterChefDeposit(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MINICHEF + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MiniChefV2Apeswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MINICHEF);

  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  // log.warning("HELLO1", [])

  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    let getBananaPerSecond = masterchefV2Contract.try_bananaPerSecond();
    if (!getBananaPerSecond.reverted) {
      masterChefV2.adjustedRewardTokenRate = getBananaPerSecond.value;
      masterChefV2.lastUpdatedRewardRate = event.block.number;
    }
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

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

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
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

export function updateMasterChefWithdraw(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MINICHEF + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MiniChefV2Apeswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MINICHEF);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    let getBananaPerSecond = masterchefV2Contract.try_bananaPerSecond();
    if (!getBananaPerSecond.reverted) {
      masterChefV2.adjustedRewardTokenRate = getBananaPerSecond.value;
      masterChefV2.lastUpdatedRewardRate = event.block.number;
    }
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

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
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
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

// export function updateMasterChefHarvest(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
//   let masterChefPool = _MasterChefStakingPool.load(pid.toString())!;
//   // Return if pool does not exist
//   let pool = LiquidityPool.load(masterChefPool.poolAddress!);
//   if (!pool) {
//     return;
//   }
//   pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount)
// }
