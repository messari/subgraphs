import {
  getOrCreateToken,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { Token, Vault as VaultStore } from "../../generated/schema";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";

export function updateRewardTokenInfo(
  vault: VaultStore,
  rewardToken: Token,
  rewardRate: BigInt,
  block: ethereum.Block
): void {
  const rewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardRate.toBigDecimal(),
    constants.RewardIntervalType.TIMESTAMP
  );

  const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

  updateRewardTokenEmissions(
    vault,
    Address.fromString(rewardToken.id),
    rewardPerDay,
    block
  );

  log.warning("[Rewards] Vault: {}, rewardTokenAddress: {}, RewardRate: {}", [
    vault.id,
    rewardToken.id,
    rewardRatePerDay.toString(),
  ]);
}

export function updateRewardTokenEmissions(
  vault: VaultStore,
  rewardTokenAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

  if (!vault.rewardTokens) {
    vault.rewardTokens = [];
  }

  const rewardTokens = vault.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    vault.rewardTokens = rewardTokens.sort();
  }

  const rewardTokenIndex = vault.rewardTokens!.indexOf(rewardToken.id);

  if (!vault.rewardTokenEmissionsAmount) {
    vault.rewardTokenEmissionsAmount = [];
  }
  const rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount!;

  if (!vault.rewardTokenEmissionsUSD) {
    vault.rewardTokenEmissionsUSD = [];
  }
  const rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD!;

  const token = getOrCreateToken(rewardTokenAddress, block);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
