import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Staking as StakingContract } from "../../generated/Staking/Staking";
import { StakingV2 as StakingContractV2 } from "../../generated/StakingV2/StakingV2";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getUsdPricePerToken } from "../prices";
import { getOrCreateLiquidityPool, getOrCreateRewardToken, getOrCreateToken } from "../common/initializers";
import { getRewardsPerDay } from "../common/rewards";
export function handleStaking(
  type: string,
  block: ethereum.Block,
  poolId: BigInt,
  stakingAddress: Address,
  amount: BigInt,
): void {
  let stakingContract = StakingContract.bind(stakingAddress);
  const poolInfoCall = stakingContract.try_poolInfo(poolId);
  if (!poolInfoCall.reverted) {
    let lpTokenAddress = poolInfoCall.value.value0;
    let allocPoint = poolInfoCall.value.value1;

    let totalAllocPoint = utils.readValue<BigInt>(stakingContract.try_totalAllocPoint(), constants.BIGINT_ZERO);
    if (totalAllocPoint.equals(constants.BIGINT_ZERO)) {
      return;
    }
    let contractRewardsPerSecond = utils.readValue<BigInt>(
      stakingContract.try_rewardsPerSecond(),
      constants.BIGINT_ZERO,
    );
    let rewardsPerSecond = allocPoint.times(contractRewardsPerSecond).div(totalAllocPoint);
    const rewardTokenPriceUSD = getUsdPricePerToken(constants.EPS_ADDRESS).decimalsBaseTen;
    let rewardsPerSecondUSD = rewardsPerSecond
      .toBigDecimal()
      .times(rewardTokenPriceUSD)
      .div(constants.DEFAULT_DECIMALS_BIG_DECIMAL);
    let rewardToken = getOrCreateRewardToken(constants.EPS_ADDRESS, block);
    let poolAddress = utils.getPoolFromLpToken(lpTokenAddress);

    if (poolAddress == constants.ADDRESS_ZERO) {
      log.error("pool address not found for lpToken: {}", [lpTokenAddress.toHexString()]);
      return;
    }
    let pool = getOrCreateLiquidityPool(poolAddress, block);

    let rewardTokens = pool.rewardTokens!;
    if (!rewardTokens.includes(rewardToken.id)) {
      rewardTokens.push(rewardToken.id);
      pool.rewardTokens = rewardTokens;
    }
    let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
    let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;
    let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;
    rewardTokenEmissionsAmount[rewardTokenIndex] = rewardsPerSecond;
    rewardTokenEmissionsUSD[rewardTokenIndex] = rewardsPerSecondUSD;

    pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
     if (!pool.stakedOutputTokenAmount) {
    pool.stakedOutputTokenAmount = constants.BIGINT_ZERO;
  }
    if (type == "WITHDRAW") {
      pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
    }
    if (type == "DEPOSIT") {
      pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
    }
    pool.save();
  }
}

export function handleStakingV2(
  type: string,
  block: ethereum.Block,
  stakingAddress: Address,
  amount: BigInt,
  tokenAddress: Address,
  
): void {
  let poolAddress = utils.getPoolFromLpToken(tokenAddress);
  if (poolAddress == constants.ADDRESS_ZERO) {
    return;
  }

  let stakingContractV2 = StakingContractV2.bind(stakingAddress);
  let pool = getOrCreateLiquidityPool(poolAddress, block);
  
  let poolInfoCall = stakingContractV2.try_poolInfo(tokenAddress);
  
  if (!poolInfoCall.reverted) {
    let rewardsPerSecond = BigDecimal.fromString(poolInfoCall.value.value1.toString());
    let rewardTokensPerDay= getRewardsPerDay(block.timestamp,block.number,rewardsPerSecond,constants.RewardIntervalType.TIMESTAMP)
    updateRewardTokenEmissions(constants.EPX_ADDRESS, poolAddress, BigInt.fromString(rewardTokensPerDay.truncate(0).toString()), block);
    
    
  }
  if (!pool.stakedOutputTokenAmount) {
    pool.stakedOutputTokenAmount = constants.BIGINT_ZERO;
  }
  
  if (type == "WITHDRAW") {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }
  if (type == "DEPOSIT") {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  }
  pool.save();
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  poolAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

  if (!pool.rewardTokens) {
    pool.rewardTokens = [];
  }

  let rewardTokens = pool.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!pool.rewardTokenEmissionsAmount) {
    pool.rewardTokenEmissionsAmount = [];
  }
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;

  if (!pool.rewardTokenEmissionsUSD) {
    pool.rewardTokenEmissionsUSD = [];
  }
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

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
