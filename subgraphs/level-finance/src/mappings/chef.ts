import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  Harvest,
  LevelMaster,
} from "../../generated/LevelMaster/LevelMaster";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const chefContract = LevelMaster.bind(
    Address.fromString("0x5aE081b6647aEF897dEc738642089D4BDa93C0e7")
  );
  const rewardPerSecond = utils.readValue(
    chefContract.try_rewardPerSecond(),
    constants.BIGINT_ZERO
  );
  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    seniorLlpToken,
    rewardTokenEmission
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const chefContract = LevelMaster.bind(
    Address.fromString("0x5aE081b6647aEF897dEc738642089D4BDa93C0e7")
  );
  const rewardPerSecond = utils.readValue(
    chefContract.try_rewardPerSecond(),
    constants.BIGINT_ZERO
  );
  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    seniorLlpToken,
    rewardTokenEmission
  );
}

// Update the allocation points of the pool.
export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const chefContract = LevelMaster.bind(
    Address.fromString("0x5aE081b6647aEF897dEc738642089D4BDa93C0e7")
  );
  const rewardPerSecond = utils.readValue(
    chefContract.try_rewardPerSecond(),
    constants.BIGINT_ZERO
  );
  const seniorLlpToken = sdk.Tokens.getOrCreateToken(
    constants.SENIOR_LLP_ADDRESS
  );
  const rewardToken = sdk.Tokens.getOrCreateRewardToken(
    seniorLlpToken,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenEmission = rewardPerSecond.times(
    BigInt.fromI32(constants.SECONDS_PER_DAY)
  );

  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    seniorLlpToken,
    rewardTokenEmission
  );
}
