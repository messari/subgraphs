// Stake LLP to earn LVL
// LVL staking reward token is senior LLP
// Masterchef/Farming is LP staking reward token is LVL
import { Staked, Unstaked } from "../../generated/LevelStake/Staking";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreatePool, initializeSDK } from "../common/initializers";
import { Staking as StakingContract } from "../../generated/LevelStake/Staking";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function handleStaked(event: Staked): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const stakingContract = StakingContract.bind(
    Address.fromString("0x08A12FFedf49fa5f149C73B07E31f99249e40869")
  );
  const rewardPerSecond = utils.readValue(
    stakingContract.try_rewardPerSecond(),
    constants.BIGINT_ZERO
  );
  const lvlToken = sdk.Tokens.getOrCreateToken(constants.LEVEL_TOKEN_ADDRESS);
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    lvlToken,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    lvlToken,
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
    stakingContract.try_rewardPerSecond(),
    constants.BIGINT_ZERO
  );
  const lvlToken = sdk.Tokens.getOrCreateToken(constants.LEVEL_TOKEN_ADDRESS);
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    lvlToken,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    lvlToken,
    rewardTokenEmission
  );
}
