import { BigInt } from "@graphprotocol/graph-ts";
import {
  TokensPerIntervalChange,
  RewardDistributor,
} from "../../generated/FeeGlpRewardDistributor/RewardDistributor";
import { getOrCreateToken, getOrCreateRewardToken } from "../entities/token";
import { updatePoolRewardToken } from "../entities/pool";
import { takeSnapshots } from "../entities/snapshots";
import { convertTokenToDecimal } from "../utils/numbers";
import { SECONDS_PER_DAY } from "../utils/constants";

export function handleEthToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

export function handleEsgmxToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

function handleTokensPerIntervalChange(event: TokensPerIntervalChange): void {
  takeSnapshots(event);

  const rewardDistributorContract = RewardDistributor.bind(event.address);
  const tryRewardToken = rewardDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.amount.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = getOrCreateRewardToken(event, rewardTokenAddress);
  const token = getOrCreateToken(event, rewardTokenAddress);
  const tokensPerDayUSD = convertTokenToDecimal(
    tokensPerDay,
    token.decimals
  ).times(token.lastPriceUSD!);

  updatePoolRewardToken(event, rewardToken, tokensPerDay, tokensPerDayUSD);
}
