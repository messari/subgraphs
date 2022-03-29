import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { RewardAdded, RewardPaid, StakingRewards } from "../../generated/StakingRewards/StakingRewards";
import { BIGINT_HUNDRED, BIGINT_ZERO, NULL_ADDRESS, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateReward } from "../entities/Token";
import { getOrCreateVault } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { getDay } from "../utils/numbers";
import { getFeePercentange } from "./common";
import { getUsdPriceOfToken } from "./price";

export function handleRewardPaid(event: RewardPaid): void {
  const rewardsAddress = event.address;
  const rewardsContract = StakingRewards.bind(rewardsAddress);

  const vaultAddress = readValue<Address>(rewardsContract.try_stakingToken(), NULL_ADDRESS);
  let vault = Vault.load(vaultAddress.toHex());

  if (vault) {
    let rewardTokenEmissionsAmount: BigInt[] = [];
    let rewardTokenEmissionsUSD: BigDecimal[] = [];
    let rewardTokens = vault.rewardTokens ? vault.rewardTokens : [];

    if (rewardTokens) {
      for (let i = 0; i < rewardTokens.length; i++) {
        let rewardTokenAddress = Address.fromString(rewardTokens[i]);
        let rewardToken = getOrCreateReward(rewardTokenAddress);
        let rewardTokenPrice = getUsdPriceOfToken(rewardTokenAddress);
        let rewardTokenDecimals = BIGINT_ZERO.pow(rewardToken.decimals as u8);

        rewardTokenEmissionsAmount.push(event.params.reward);
        rewardTokenEmissionsUSD.push(
          rewardTokenPrice.times(event.params.reward.toBigDecimal()).div(rewardTokenDecimals.toBigDecimal()),
        );
      }
    }

    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
    vault.save();
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  const stakingContract = StakingRewards.bind(event.address);

  const vaultAddress = readValue<Address>(stakingContract.try_stakingToken(), NULL_ADDRESS);
  let vault = getOrCreateVault(vaultAddress, event.block);

  const rewardTokenAddress = readValue<Address>(stakingContract.try_rewardsToken(), NULL_ADDRESS);
  let financialMetrics = getOrCreateFinancialsDailySnapshot(getDay(event.block.timestamp));
  let supplySideRevenue = event.params.reward;

  let performanceFee = getFeePercentange(vault, VaultFeeType.PERFORMANCE_FEE);
  let totalRevenue = supplySideRevenue
    .times(BIGINT_HUNDRED)
    .div(BIGINT_HUNDRED.minus(BigInt.fromString(performanceFee.toString())));
  let protocolRevenue = totalRevenue.minus(supplySideRevenue);

  let rewardToken = getOrCreateReward(rewardTokenAddress);
  let rewardTokenDecimals = BigInt.fromI32(10).pow(rewardToken.decimals as u8);
  let rewardTokenPrice = getUsdPriceOfToken(rewardTokenAddress);

  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
    rewardTokenPrice.times(supplySideRevenue.toBigDecimal()).div(rewardTokenDecimals.toBigDecimal()),
  );
  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD
    .plus(rewardTokenPrice.times(protocolRevenue.toBigDecimal()))
    .plus(financialMetrics.feesUSD);

  financialMetrics.save();
  rewardToken.save();
}
