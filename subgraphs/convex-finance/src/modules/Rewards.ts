import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { ERC20 as ERC20Contract } from "../../generated/Booster/ERC20";
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
  const convexTokenContract = ERC20Contract.bind(
    constants.CONVEX_TOKEN_ADDRESS
  );

  let cvxTokenDecimals = utils.getTokenDecimals(constants.CONVEX_TOKEN_ADDRESS);
  let cvxTokenSupply = utils
    .readValue<BigInt>(
      convexTokenContract.try_totalSupply(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal()
    .div(cvxTokenDecimals);

  let currentCliff = cvxTokenSupply.div(constants.CVX_CLIFF_SIZE);

  let cvxRewardPerDay: BigDecimal = constants.BIGDECIMAL_ZERO;
  if (currentCliff.lt(constants.CVX_CLIFF_COUNT)) {
    let remaining = constants.CVX_CLIFF_COUNT.minus(currentCliff);

    cvxRewardPerDay = crvRewardPerDay
      .toBigDecimal()
      .times(remaining)
      .div(constants.CVX_CLIFF_COUNT);

    let amountTillMax = constants.CVX_MAX_SUPPLY.minus(cvxTokenSupply);
    if (cvxRewardPerDay.gt(amountTillMax)) {
      cvxRewardPerDay = amountTillMax;
    }
  }

  updateRewardTokenEmissions(
    poolId,
    constants.CONVEX_TOKEN_ADDRESS,
    BigInt.fromString(cvxRewardPerDay.toString()),
    block
  );

  log.warning("[CVX_Rewards] poolId: {}, RewardRate: {}", [
    poolId.toString(),
    cvxRewardPerDay.toString(),
  ]);
}

export function updateRewardToken(
  poolId: BigInt,
  poolRewardsAddress: Address,
  block: ethereum.Block
): void {
  const rewardsContract = RewardPoolContract.bind(poolRewardsAddress);

  let rewardToken = utils.readValue<Address>(
    rewardsContract.try_rewardToken(),
    constants.NULL.TYPE_ADDRESS
  );

  let rewardRate = utils.readValue<BigInt>(
    rewardsContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );

  let rewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardRate.toBigDecimal(),
    constants.RewardIntervalType.TIMESTAMP
  );
  let rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

  if (rewardToken.equals(constants.CRV_TOKEN_ADDRESS)) {
    updateConvexRewardToken(poolId, rewardPerDay, block);
  }

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

  let extraRewardTokensLength = utils.readValue<BigInt>(
    rewardsContract.try_extraRewardsLength(),
    constants.BIGINT_ZERO
  );

  for (let i = 0; i < extraRewardTokensLength.toI32(); i += 1) {
    let extraRewardToken = utils.readValue<Address>(
      rewardsContract.try_extraRewards(BigInt.fromI32(i)),
      constants.NULL.TYPE_ADDRESS
    );

    let rewardRate = utils.readValue<BigInt>(
      rewardsContract.try_rewards(extraRewardToken),
      constants.BIGINT_ZERO
    );

    let rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      rewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    let rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

    updateRewardTokenEmissions(poolId, extraRewardToken, rewardPerDay, block);

    log.warning(
      "[ExtraRewards] poolId: {}, ExtraRewardToken: {}, RewardRate: {}",
      [
        poolId.toString(),
        extraRewardToken.toHexString(),
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

  let rewardTokens = vault.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    vault.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!vault.rewardTokenEmissionsAmount) {
    vault.rewardTokenEmissionsAmount = [];
  }
  let rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount!;

  if (!vault.rewardTokenEmissionsUSD) {
    vault.rewardTokenEmissionsUSD = [];
  }
  let rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD!;

  const rewardTokenPrice = getUsdPricePerToken(rewardTokenAddress);
  const rewardTokenDecimals = utils.getTokenDecimals(rewardTokenAddress);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice)
    .div(rewardTokenPrice.decimalsBaseTen);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
