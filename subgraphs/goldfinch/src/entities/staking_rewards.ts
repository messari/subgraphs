import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { StakingRewardsData } from "../../generated/schema";
import { StakingRewards as StakingRewardsContract } from "../../generated/StakingRewards/StakingRewards";
import {
  BIGDECIMAL_ZERO,
  GFI_ADDRESS,
  GFI_DECIMALS,
  RewardTokenType,
  SECONDS_PER_DAY,
  SENIOR_POOL_ADDRESS,
} from "../common/constants";
import {
  getGFIPrice,
  getOrCreateMarket,
  getOrCreateRewardToken,
} from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";

import { updateEstimatedApyFromGfiRaw } from "./senior_pool";

const STAKING_REWARDS_ID = "1";

export function getStakingRewards(): StakingRewardsData {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ID);
  if (!stakingRewards) {
    stakingRewards = new StakingRewardsData(STAKING_REWARDS_ID);
    stakingRewards.currentEarnRatePerToken = BigInt.zero();
  }
  return stakingRewards;
}

export function updateCurrentEarnRate(contractAddress: Address): void {
  const contract = StakingRewardsContract.bind(contractAddress);
  const callResult = contract.try_currentEarnRatePerToken();
  if (!callResult.reverted) {
    const stakingRewards = getStakingRewards();
    stakingRewards.currentEarnRatePerToken = callResult.value;

    stakingRewards.save();
    updateEstimatedApyFromGfiRaw();
  }
}

export function updateSeniorPoolRewardTokenEmissions(
  event: ethereum.Event
): void {
  const stakingReward = getStakingRewards();
  const seniorPool = getOrCreateMarket(SENIOR_POOL_ADDRESS, event);

  const rewardTokens = seniorPool.rewardTokens;
  if (!rewardTokens || rewardTokens.length == 0) {
    // GFI reward token only for staker of FIDU (output) token
    const rewardTokenAddress = Address.fromString(GFI_ADDRESS);
    const rewardToken = getOrCreateRewardToken(
      rewardTokenAddress,
      RewardTokenType.DEPOSIT
    );
    seniorPool.rewardTokens = [rewardToken.id];
  }

  // since FIDU and GFI both have 18 decimals
  const rewardTokenEmissionsAmount = bigDecimalToBigInt(
    seniorPool.outputTokenSupply
      .times(stakingReward.currentEarnRatePerToken)
      .times(BigInt.fromI32(SECONDS_PER_DAY))
      .divDecimal(GFI_DECIMALS)
  );

  const GFIpriceUSD = getGFIPrice(event);
  const rewardTokenEmissionsUSD = !GFIpriceUSD
    ? BIGDECIMAL_ZERO
    : rewardTokenEmissionsAmount.divDecimal(GFI_DECIMALS).times(GFIpriceUSD);
  seniorPool.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
  seniorPool.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];
  log.info(
    "[updateSeniorPoolRewardTokenEmissions]daily emission amout={}, USD={} at tx {}",
    [
      rewardTokenEmissionsAmount.toString(),
      rewardTokenEmissionsUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
  seniorPool.save();
}
