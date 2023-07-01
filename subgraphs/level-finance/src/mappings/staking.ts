// Stake LLP to earn LVL
// LVL staking reward token is senior LLP
// Masterchef/Farming is LP staking reward token is LVL

// Senior LLP is the reward token
import {
  RewardsPerSecondSet,
  Staked,
  Unstaked,
} from "../../generated/LevelStake/Staking";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreatePool, initializeSDK } from "../common/initializers";
import { Staking as StakingContract } from "../../generated/LevelStake/Staking";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { RewardTokenType } from "../sdk/util/constants";

export function handleStaked(event: Staked): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const stakingContract = StakingContract.bind(
    Address.fromString("0x08A12FFedf49fa5f149C73B07E31f99249e40869")
  );
  const rewardPerSecond = utils.readValue(
    stakingContract.try_rewardsPerSecond(),
    constants.BIGINT_ZERO
  );
  log.warning("[Rewards] rewardsPerSecond {} ", [rewardPerSecond.toString()]);
  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    RewardTokenType.STAKE
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    RewardTokenType.STAKE,
    seniorLlpToken,
    rewardTokenEmission
  );
}

export function handleUnstaked(event: Unstaked): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  const stakingContract = StakingContract.bind(
    Address.fromString("0x08A12FFedf49fa5f149C73B07E31f99249e40869")
  );
  const rewardPerSecond = utils.readValue(
    stakingContract.try_rewardsPerSecond(),
    constants.BIGINT_ZERO
  );
  log.warning("[Rewards] rewardsPerSecond {} ", [rewardPerSecond.toString()]);

  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    RewardTokenType.STAKE
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    RewardTokenType.STAKE,
    seniorLlpToken,
    rewardTokenEmission
  );
}

export function handleRewardPerSecondSet(event: RewardsPerSecondSet): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  const rewardPerSecond = event.params._rewardsPerSecond;
  log.warning("[RewardsUpdated] rewardsPerSecond {} ", [
    rewardPerSecond.toString(),
  ]);

  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    RewardTokenType.STAKE
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    RewardTokenType.STAKE,
    seniorLlpToken,
    rewardTokenEmission
  );
}
