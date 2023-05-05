import {
  TokensPerIntervalChange,
  RewardDistributor,
} from "../../generated/FeeGlpRewardDistributor/RewardDistributor";
import { BigInt } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { RewardTokenType } from "../sdk/util/constants";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function handleEthToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

export function handleEsgmxToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

function handleTokensPerIntervalChange(event: TokensPerIntervalChange): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(event, sdk);

  const rewardDistributorContract = RewardDistributor.bind(event.address);
  const tryRewardToken = rewardDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.amount.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );
  const token = sdk.Tokens.getOrCreateToken(rewardTokenAddress);
  sdk.Tokens.getOrCreateRewardToken(token, RewardTokenType.DEPOSIT);

  pool.setRewardEmissions(RewardTokenType.DEPOSIT, token, tokensPerDay);
}
