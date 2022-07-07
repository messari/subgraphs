import {
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { PoolRewards as PoolRewardsContract } from "../../generated/templates/PoolRewards/PoolRewards";

export function updateRewardToken(
  vaultAddress: Address,
  poolRewardsAddress: Address,
  block: ethereum.Block
): void {
  const poolRewardsContract = PoolRewardsContract.bind(poolRewardsAddress);

  let rewardTokens = utils.readValue<Address[]>(
    poolRewardsContract.try_getRewardTokens(),
    []
  );

  for (let i = 0; i < rewardTokens.length; i += 1) {
    let rewardToken = rewardTokens[i];

    let rewardRate = utils.readValue<BigInt>(
      poolRewardsContract.try_rewardRates(rewardToken),
      constants.BIGINT_ZERO
    );

    let rewardRatePerDay = rewardRate.times(
      BigInt.fromI32(constants.SECONDS_PER_DAY as u8)
    );

    updateRewardTokenEmissions(
      rewardToken,
      vaultAddress,
      rewardRatePerDay,
      block
    );

    log.warning("[Rewards] Vault: {}, RewardToken: {}, RewardRate: {}", [
      vaultAddress.toHexString(),
      rewardToken.toHexString(),
      rewardRatePerDay.toString(),
    ]);
  }
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  vaultAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
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

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .times(rewardTokenPrice.usdPrice)
    .times(rewardTokenPrice.decimalsBaseTen)
    .times(rewardTokenPrice.decimalsBaseTen);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
