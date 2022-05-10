import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { getTotalFees } from "./Fees";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getOrCreateRewardTokenInfo } from "./Tokens";
import { updateFinancialsAfterReport } from "./Metric";
import { Vault as VaultStore } from "../../generated/schema";
import { BaseRewardPool } from "../../generated/Booster/BaseRewardPool";

export function getHistoricalRewards(rewardTokenPool: Address): BigInt {
  const rewardsContract = BaseRewardPool.bind(rewardTokenPool);
  const historicalRewards = utils.readValue<BigInt>(
    rewardsContract.try_historicalRewards(),
    constants.BIGINT_ZERO
  );

  return historicalRewards;
}

export function getExtraRewardsRevenue(
  poolId: BigInt,
  vault: VaultStore
): BigDecimal {
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

    const rewardTokenDecimals = constants.BIGINT_TEN.pow(
      utils.getTokenDecimals(extraRewardTokenAddress) as u8
    ).toBigDecimal();
    const rewardTokenPrice = getUsdPricePerToken(extraRewardTokenAddress);

    const rewardTokenInfoStore = getOrCreateRewardTokenInfo(
      poolId,
      extraRewardTokenAddress
    );
    const historicalRewards = getHistoricalRewards(
      Address.fromString(rewardTokenInfoStore.rewardTokenPool)
    );
    const totalRewards = historicalRewards
      .minus(rewardTokenInfoStore._previousExtraHistoricalRewards)
      .toBigDecimal();

    const totalRewardsUSD = totalRewards
      .times(rewardTokenPrice.usdPrice)
      .div(rewardTokenPrice.decimalsBaseTen)
      .div(rewardTokenDecimals);
    extraRewardsRevenueUSD = extraRewardsRevenueUSD.plus(totalRewardsUSD);

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
  vaultId: string,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = VaultStore.load(vaultId);
  if (!vault) return;

  const crvRewardTokenAddress = Address.fromString(vault.rewardTokens![0]);
  const crvRewardTokenInfoStore = getOrCreateRewardTokenInfo(
    poolId,
    crvRewardTokenAddress
  );

  const crvRewardTokenDecimals = constants.BIGINT_TEN.pow(
    utils.getTokenDecimals(crvRewardTokenAddress) as u8
  ).toBigDecimal();
  const crvRewardTokenPrice = getUsdPricePerToken(crvRewardTokenAddress);

  const historicalCvxCrvStakerRewards = getHistoricalRewards(
    Address.fromString(crvRewardTokenInfoStore.rewardTokenPool)
  );
  const totalRewardsAfterFeesCut = historicalCvxCrvStakerRewards
    .minus(crvRewardTokenInfoStore._previousExtraHistoricalRewards)
    .toBigDecimal();
  
  crvRewardTokenInfoStore._previousExtraHistoricalRewards = historicalCvxCrvStakerRewards;

  const totalFeesConvex = getTotalFees();

  // calculate total rewards of the pool
  const totalRewards = totalRewardsAfterFeesCut
    .div(crvRewardTokenDecimals)
    .div(constants.BIGDECIMAL_ONE.minus(totalFeesConvex.totalFees()));

  const lockFee = totalRewards.times(totalFeesConvex.lockIncentive); // incentive to crv stakers
  const stakerFee = totalRewards.times(totalFeesConvex.stakerIncentive); // incentive to native token stakers
  const callFee = totalRewards.times(totalFeesConvex.callIncentive); // incentive to users who spend gas to make calls
  const platformFee = totalRewards.times(totalFeesConvex.platformFee); // possible fee to build treasury

  const extraRewardsUSD = getExtraRewardsRevenue(poolId, vault);

  let supplySideRevenueUSD = totalRewardsAfterFeesCut
    .plus(lockFee)
    .plus(extraRewardsUSD)
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

  let protocolSideRevenueUSD = stakerFee
    .plus(callFee)
    .plus(platformFee)
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

  let totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

  crvRewardTokenInfoStore.save();
  vault.save();

  updateFinancialsAfterReport(
    block,
    totalRevenueUSD,
    supplySideRevenueUSD,
    protocolSideRevenueUSD
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
