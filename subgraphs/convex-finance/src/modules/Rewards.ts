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
import { getTotalFees } from "./Fees";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { getRewardsPerDay } from "../common/rewards";
import { getOrCreateRewardTokenInfo } from "./Tokens";
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

export function getExtraRewardsRevenue(
  poolId: BigInt,
  block: ethereum.Block
): BigDecimal {
  const vault = getOrCreateVault(poolId, block);
  if (!vault) return constants.BIGDECIMAL_ZERO;

  let extraRewardsRevenueUSD = constants.BIGDECIMAL_ZERO;
  let rewardsTokensLength = vault.rewardTokens!.length;

  for (
    let rewardTokenIdx = 1;
    rewardTokenIdx < rewardsTokensLength;
    rewardTokenIdx++
  ) {
    const extraRewardTokenAddress = Address.fromString(
      vault.rewardTokens![rewardTokenIdx]
    );

    const rewardTokenPrice = getUsdPricePerToken(extraRewardTokenAddress);
    const rewardTokenDecimals = utils.getTokenDecimals(extraRewardTokenAddress);

    const rewardTokenInfoStore = getOrCreateRewardTokenInfo(
      poolId,
      block,
      extraRewardTokenAddress
    );
    const historicalRewards = getHistoricalRewards(
      Address.fromString(rewardTokenInfoStore.rewardTokenPool)
    );
    const totalRewards = historicalRewards.minus(
      rewardTokenInfoStore._previousExtraHistoricalRewards
    );

    const totalRewardsUSD = totalRewards
      .toBigDecimal()
      .times(rewardTokenPrice.usdPrice)
      .div(rewardTokenPrice.decimalsBaseTen)
      .div(rewardTokenDecimals);
    extraRewardsRevenueUSD = extraRewardsRevenueUSD.plus(totalRewardsUSD);

    rewardTokenInfoStore.lastRewardTimestamp = block.timestamp;
    rewardTokenInfoStore._previousExtraHistoricalRewards = historicalRewards;
    rewardTokenInfoStore.save();

    log.warning(
      "[ExtraRewards] poolId: {}, extraRewardTokenAddress: {}, totalRewards: {}, totalRewardsUSD: {}",
      [
        poolId.toString(),
        extraRewardTokenAddress.toHexString(),
        totalRewards.toString(),
        totalRewardsUSD.toString(),
      ]
    );
  }

  return extraRewardsRevenueUSD;
}

export function _EarmarkRewards(
  poolId: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(poolId, block);
  if (!vault) return;

  const crvRewardTokenAddress = Address.fromString(vault.rewardTokens![0]);
  const crvRewardTokenInfoStore = getOrCreateRewardTokenInfo(
    poolId,
    block,
    crvRewardTokenAddress
  );

  const crvRewardTokenPrice = getUsdPricePerToken(crvRewardTokenAddress);
  const crvRewardTokenDecimals = utils.getTokenDecimals(crvRewardTokenAddress);

  const historicalCvxCrvStakerRewards = getHistoricalRewards(
    Address.fromString(crvRewardTokenInfoStore.rewardTokenPool)
  );
  const totalRewardsAfterFeesCut = historicalCvxCrvStakerRewards.minus(
    crvRewardTokenInfoStore._previousExtraHistoricalRewards
  );

  const totalFeesConvex = getTotalFees();

  // calculate total rewards of the pool
  const totalRewards = totalRewardsAfterFeesCut
    .toBigDecimal()
    .div(crvRewardTokenDecimals)
    .div(constants.BIGDECIMAL_ONE.minus(totalFeesConvex.totalFees()));

  const lockFee = totalRewards.times(totalFeesConvex.lockIncentive); // incentive to crv stakers
  const stakerFee = totalRewards.times(totalFeesConvex.stakerIncentive); // incentive to native token stakers
  const callFee = totalRewards.times(totalFeesConvex.callIncentive); // incentive to users who spend gas to make calls
  const platformFee = totalRewards.times(totalFeesConvex.platformFee); // possible fee to build treasury

  const extraRewardsUSD = getExtraRewardsRevenue(poolId, block);

  let supplySideRevenueUSD = totalRewardsAfterFeesCut
    .toBigDecimal()
    .div(crvRewardTokenDecimals)
    .plus(lockFee)
    .plus(extraRewardsUSD)
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

  let protocolSideRevenueUSD = stakerFee
    .plus(callFee)
    .plus(platformFee)
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

  crvRewardTokenInfoStore.lastRewardTimestamp = block.timestamp;
  crvRewardTokenInfoStore._previousExtraHistoricalRewards = historicalCvxCrvStakerRewards;
  crvRewardTokenInfoStore.save();

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    block
  );

  log.warning(
    "[EarMarkRewards] PoolId: {}, TotalRewards: {}, lockFee: {}, callFee: {}, stakerFee: {}, platformFee: {}, TxHash: {}",
    [
      poolId.toString(),
      totalRewards.toString(),
      lockFee.toString(),
      callFee.toString(),
      stakerFee.toString(),
      platformFee.toString(),
      transaction.hash.toHexString(),
    ]
  );
}

export function updateConvexRewardToken(
  poolId: BigInt,
  crvRewardRate: BigInt,
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

  let cvxRewardRate: BigDecimal = constants.BIGDECIMAL_ZERO;
  if (currentCliff.lt(constants.CVX_CLIFF_COUNT)) {
    let remaining = constants.CVX_CLIFF_COUNT.minus(currentCliff);

    cvxRewardRate = crvRewardRate
      .toBigDecimal()
      .times(remaining)
      .div(constants.CVX_CLIFF_COUNT);

    let amountTillMax = constants.CVX_MAX_SUPPLY.minus(cvxTokenSupply);
    if (cvxRewardRate.gt(amountTillMax)) {
      cvxRewardRate = amountTillMax;
    }
  }

  let cvxRewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    cvxRewardRate,
    constants.RewardIntervalType.TIMESTAMP
  );
  let rewardPerDay = BigInt.fromString(cvxRewardRatePerDay.toString());

  updateRewardTokenEmissions(
    poolId,
    constants.CONVEX_TOKEN_ADDRESS,
    rewardPerDay,
    block
  );

  log.warning("[CVX_Rewards] poolId: {}, RewardRate: {}", [
    poolId.toString(),
    cvxRewardRatePerDay.toString(),
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

  if (rewardToken.equals(constants.CRV_TOKEN_ADDRESS)) {
    updateConvexRewardToken(poolId, rewardRate, block);
  }

  let rewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardRate.toBigDecimal(),
    constants.RewardIntervalType.TIMESTAMP
  );
  let rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

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
