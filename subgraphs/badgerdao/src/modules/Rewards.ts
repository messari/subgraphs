import {
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";

export function updateRewardTokenInfo(
  vaultAddress: Address,
  rewardToken: Token,
  rewardRate: BigInt,
  block: ethereum.Block
): void {
  let rewardRatePerDay = getRewardsPerDay(
    block.timestamp,
    block.number,
    rewardRate.toBigDecimal(),
    constants.RewardIntervalType.TIMESTAMP
  );

  let rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

  updateRewardTokenEmissions(
    Address.fromString(rewardToken.id),
    vaultAddress,
    rewardPerDay,
    block
  );

  log.warning("[Rewards] Vault: {}, rewardTokenAddress: {}, RewardRate: {}", [
    vaultAddress.toHexString(),
    rewardToken.id,
    rewardRatePerDay.toString(),
  ]);
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  vaultAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

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
