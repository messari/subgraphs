import {
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { Address, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { Gauge as GaugeContract } from "../../generated/templates/Gauge/Gauge";

export function getRewardsData_v1(gaugeAddress: Address): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = GaugeContract.bind(gaugeAddress);

  for (let idx = 0; idx < 5; idx++) {
    const rewardToken = utils.readValue<Address>(
      gaugeContract.try_rewardTokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
      return new RewardsInfoType(rewardTokens, rewardRates);
    }

    rewardTokens.push(rewardToken);

    const rewardRateCall = gaugeContract.try_rewardData(rewardToken);
    if (!rewardRateCall.reverted) {
      const rewardRate = rewardRateCall.value.getRewardRate();

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function getRewardsData_v2(gaugeAddress: Address): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = GaugeContract.bind(gaugeAddress);

  for (let idx = 0; idx < 10; idx++) {
    const rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
      return new RewardsInfoType(rewardTokens, rewardRates);
    }

    rewardTokens.push(rewardToken);

    const rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      const rewardRate = rewardRateCall.value.getRate();

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateRewardToken(
  vaultAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  let rewardsInfo = getRewardsData_v1(gaugeAddress);

  if (rewardsInfo.getRewardTokens.length === 0) {
    rewardsInfo = getRewardsData_v2(gaugeAddress);
  }

  const rewardTokens = rewardsInfo.getRewardTokens;
  const rewardRates = rewardsInfo.getRewardRates;

  for (let i = 0; i < rewardTokens.length; i += 1) {
    const rewardToken = rewardTokens[i];
    const rewardRate = rewardRates[i];

    const rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      rewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

    updateRewardTokenEmissions(rewardToken, vaultAddress, rewardPerDay, block);

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
  const token = getOrCreateToken(rewardTokenAddress, block);
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

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

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .divDecimal(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
