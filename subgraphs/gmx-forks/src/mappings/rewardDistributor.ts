import {
  TokensPerIntervalChange,
  RewardDistributor,
} from "../../generated/FeeGlpRewardDistributor/RewardDistributor";
import * as utils from "../common/utils";
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
  const pool = getOrCreatePool(sdk);

  const rewardDistributorContract = RewardDistributor.bind(event.address);
  const rewardTokenAddress = utils.readValue(
    rewardDistributorContract.try_rewardToken(),
    constants.NULL.TYPE_ADDRESS
  );

  if (rewardTokenAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.amount.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );
  const token = sdk.Tokens.getOrCreateToken(rewardTokenAddress);
  sdk.Tokens.getOrCreateRewardToken(token, RewardTokenType.DEPOSIT);

  pool.setRewardEmissions(RewardTokenType.DEPOSIT, token, tokensPerDay);
}
