import {
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { BaseRewardPool as RewardPoolContract } from "../../generated/Booster/BaseRewardPool";

export function getHistoricalRewards(rewardTokenPool: Address): BigInt {
  const rewardsContract = RewardPoolContract.bind(rewardTokenPool);
  const historicalRewards = utils.readValue<BigInt>(
    rewardsContract.try_historicalRewards(),
    constants.BIGINT_ZERO
  );

  return historicalRewards;
}

export function updateConvexRewardToken(
  poolId: BigInt,
  crvRewardPerDay: BigInt,
  block: ethereum.Block
): void {
  const cvxRewardRate = utils.getConvexTokenMintAmount(crvRewardPerDay);

  const cvxRewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    cvxRewardRate,
    constants.RewardIntervalType.TIMESTAMP
  );
  const cvxRewardPerDay = BigInt.fromString(
    cvxRewardRatePerDay.truncate(0).toString()
  );

  updateRewardTokenEmissions(
    poolId,
    constants.CONVEX_TOKEN_ADDRESS,
    cvxRewardPerDay,
    block
  );

  log.warning(
    "[cvxRewards] poolId: {}, cvxRewardRate: {}, cvxRewardPerDay: {}",
    [poolId.toString(), cvxRewardRate.toString(), cvxRewardPerDay.toString()]
  );
}

export function updateRewardToken(
  poolId: BigInt,
  poolRewardsAddress: Address,
  block: ethereum.Block
): void {
  const rewardsContract = RewardPoolContract.bind(poolRewardsAddress);

  const rewardToken = utils.readValue<Address>(
    rewardsContract.try_rewardToken(),
    constants.NULL.TYPE_ADDRESS
  );

  const rewardRate = utils.readValue<BigInt>(
    rewardsContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );

  if (rewardToken.equals(constants.CRV_TOKEN_ADDRESS)) {
    updateConvexRewardToken(poolId, rewardRate, block);
  }

  const rewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardRate.toBigDecimal(),
    constants.RewardIntervalType.TIMESTAMP
  );
  const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

  updateRewardTokenEmissions(poolId, rewardToken, rewardPerDay, block);

  log.warning("[Rewards] poolId: {}, RewardToken: {}, RewardRate: {}", [
    poolId.toString(),
    rewardToken.toHexString(),
    rewardRatePerDay.toString(),
  ]);

  updateExtraRewardTokens(poolId, poolRewardsAddress, block);
}

export function updateExtraRewardTokens(
  poolId: BigInt,
  poolRewardsAddress: Address,
  block: ethereum.Block
): void {
  const rewardsContract = RewardPoolContract.bind(poolRewardsAddress);

  const extraRewardTokensLength = utils.readValue<BigInt>(
    rewardsContract.try_extraRewardsLength(),
    constants.BIGINT_ZERO
  );

  for (let i = 0; i < extraRewardTokensLength.toI32(); i += 1) {
    const extraRewardPoolAddress = utils.readValue<Address>(
      rewardsContract.try_extraRewards(BigInt.fromI32(i)),
      constants.NULL.TYPE_ADDRESS
    );

    const extraRewardContract = RewardPoolContract.bind(extraRewardPoolAddress);

    const extraRewardTokenAddress = utils.readValue<Address>(
      extraRewardContract.try_rewardToken(),
      constants.NULL.TYPE_ADDRESS
    );
    const extraTokenRewardRate = utils.readValue<BigInt>(
      extraRewardContract.try_rewardRate(),
      constants.BIGINT_ZERO
    );

    const rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      extraTokenRewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

    updateRewardTokenEmissions(
      poolId,
      extraRewardTokenAddress,
      rewardPerDay,
      block
    );

    log.warning(
      "[ExtraRewards] poolId: {}, ExtraRewardToken: {}, RewardRate: {}",
      [
        poolId.toString(),
        extraRewardTokenAddress.toHexString(),
        rewardRatePerDay.toString(),
      ]
    );
  }
}

export function updateRewardTokenEmissions(
  poolId: BigInt,
  rewardTokenAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(poolId, block);
  if (!vault) return;

  const rewardToken = getOrCreateRewardToken(rewardTokenAddress);

  if (!vault.rewardTokens) {
    vault.rewardTokens = [];
  }

  const rewardTokens = vault.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    vault.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!vault.rewardTokenEmissionsAmount) {
    vault.rewardTokenEmissionsAmount = [];
  }
  const rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount!;

  if (!vault.rewardTokenEmissionsUSD) {
    vault.rewardTokenEmissionsUSD = [];
  }
  const rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD!;

  const rewardTokenPrice = getUsdPricePerToken(rewardTokenAddress, block);
  const rewardTokenDecimals = utils.getTokenDecimals(rewardTokenAddress);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
