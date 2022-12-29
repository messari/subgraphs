import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateRewardToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { Staking as StakingContract } from "../../generated/Staking/Staking";
import { StakingV2 as StakingContractV2 } from "../../generated/StakingV2/StakingV2";

export function handleStakingV1(poolId: BigInt, block: ethereum.Block): void {
  const stakingContract = StakingContract.bind(
    Address.fromString(constants.STAKING_V1)
  );
  const poolInfoCall = stakingContract.try_poolInfo(poolId);
  if (poolInfoCall.reverted) {
    return;
  }

  const allocPoint = poolInfoCall.value.getAllocPoint();
  const lpTokenAddress = poolInfoCall.value.getLpToken();

  const poolAddress = utils.getMinterFromLpToken(lpTokenAddress);

  if (poolAddress == constants.ADDRESS_ZERO) {
    log.error("pool address not found for lpToken: {}", [
      lpTokenAddress.toHexString(),
    ]);

    return;
  }

  const totalAllocPoint = utils
    .readValue<BigInt>(
      stakingContract.try_totalAllocPoint(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();
  if (totalAllocPoint.equals(constants.BIGDECIMAL_ZERO)) return;

  const contractRewardsPerSecond = utils.readValue<BigInt>(
    stakingContract.try_rewardsPerSecond(),
    constants.BIGINT_ZERO
  );

  const rewardsPerSecond = allocPoint
    .times(contractRewardsPerSecond)
    .divDecimal(totalAllocPoint);
  const rewardTokensPerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardsPerSecond,
    constants.RewardIntervalType.TIMESTAMP
  );

  updateRewardTokenEmissions(
    constants.EPS_ADDRESS,
    poolAddress,
    BigInt.fromString(rewardTokensPerDay.truncate(0).toString()),
    block
  );
}

export function handleStakingV2(
  lpTokenAddress: Address,
  block: ethereum.Block
): void {
  const poolAddress = utils.getMinterFromLpToken(lpTokenAddress);
  if (poolAddress == constants.ADDRESS_ZERO) {
    return;
  }

  const stakingContractV2 = StakingContractV2.bind(
    Address.fromString(constants.STAKING_V2)
  );
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  log.warning("[handleStakingV2] Pool Id{}", [pool.id]);
  const poolInfoCall = stakingContractV2.try_poolInfo(lpTokenAddress);
  if (poolInfoCall.reverted) return;
  const rewardsPerSecond = BigDecimal.fromString(
    poolInfoCall.value.getRewardsPerSecond().toString()
  );
  const adjustedSupply = poolInfoCall.value.getAdjustedSupply();
  if(adjustedSupply){
  pool.stakedOutputTokenAmount = adjustedSupply;
  pool.save();
  }
  const rewardTokensPerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardsPerSecond,
    constants.RewardIntervalType.TIMESTAMP
  );

  updateRewardTokenEmissions(
    constants.EPX_ADDRESS,
    poolAddress,
    BigInt.fromString(rewardTokensPerDay.truncate(0).toString()),
    block
  );
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  poolAddress: Address,
  rewardTokenPerDay: BigInt,
  
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);
  getOrCreateRewardToken(rewardTokenAddress, block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, block);
  if (!pool.rewardTokens) {
    pool.rewardTokens = [];
  }

  const rewardTokens = pool.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!pool.rewardTokenEmissionsAmount) {
    pool.rewardTokenEmissionsAmount = [];
  }
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;

  if (!pool.rewardTokenEmissionsUSD) {
    pool.rewardTokenEmissionsUSD = [];
  }
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

  const token = getOrCreateToken(rewardTokenAddress, block);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool.save();
}
