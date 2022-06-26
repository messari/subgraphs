import * as utils from "../common/utils";
import { Market } from "../../generated/schema";
import * as constants from "../common/constants";
import { amountInUSD, getAssetPriceInUSDC } from "./Price";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/initializers";
import { AToken } from "../../generated/templates/AToken/AToken";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { AaveIncentivesController as IncentivesControllerContract } from "../../generated/templates/LendingPoolAddressesProvider/AaveIncentivesController";

export function getIncentiveControllerAddress(
  outputTokenAddress: Address
): Address {
  const aTokenContract = AToken.bind(outputTokenAddress);

  return utils.readValue<Address>(
    aTokenContract.try_getIncentivesController(),
    Address.fromString(constants.INCENTIVE_CONTROLLER_ADDRESS)
  );
}

export function emissionsPerDay(rewardRatePerSecond: BigInt): BigInt {
  // Take the reward rate per second, divide out the decimals
  // and get the emissions per day
  const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(<i32>constants.SECONDS_PER_DAY);

  return rewardRatePerSecond
    .times(BIGINT_SECONDS_PER_DAY)
    .div(constants.BIGINT_TEN_TO_EIGHTEENTH);
}

export function getCurrentRewardEmissions(market: Market): BigInt[] {
  let borrowRewardEmissions = constants.BIGINT_ZERO;
  let depositRewardEmissions = constants.BIGINT_ZERO;

  // Attempt to get the incentives controller contract
  const outputTokenAddress = Address.fromString(market.outputToken!);
  const incentivesController = getIncentiveControllerAddress(
    outputTokenAddress
  );

  // From the incentives controller contract, get pull the 'assets' values
  // from the market aToken, sToken, and vToken
  const incentivesControllerContract = IncentivesControllerContract.bind(
    incentivesController
  );

  const controllerAssets = incentivesControllerContract.try_assets(
    outputTokenAddress
  );

  if (controllerAssets.reverted)
    return [borrowRewardEmissions, depositRewardEmissions];

  // Get the emissions per day for the aToken rewards for deposits
  const assetDataSupply = controllerAssets.value.value0;
  depositRewardEmissions = emissionsPerDay(assetDataSupply);

  const assetDataBorrowStable = incentivesControllerContract.try_assets(
    Address.fromString(market._sToken)
  ).value.value0;
  const assetDataBorrowVariable = incentivesControllerContract.try_assets(
    Address.fromString(market._vToken)
  ).value.value0;

  // Get the emissions per second for both the sToken and vToken rewards,
  // average them and get the daily emissions for borrows
  const borrowRewardsAvgRate = assetDataBorrowStable
    .plus(assetDataBorrowVariable)
    .div(constants.BIGINT_TWO);

  borrowRewardEmissions = emissionsPerDay(borrowRewardsAvgRate);

  return [depositRewardEmissions, borrowRewardEmissions];
}

export function getCurrentRewardEmissionsUSD(market: Market): BigDecimal[] {
  // Taking the reward emissions denominated in the reward token,
  // convert it to the value in USD
  const rewardEmissionsUSD = market.rewardTokenEmissionsUSD!;
  const rewardTokenAddr = Address.fromString(constants.REWARD_TOKEN_ADDRESS);

  // The DEPOSIT reward token is used as the default.
  // Both the deposit and borrow reward token decimals are the same
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddr,
    constants.RewardTokenType.DEPOSIT
  );
  const rewardTokenDecimals = getOrCreateToken(
    Address.fromString(rewardToken.token)
  ).decimals;

  const rewardPriceInUSDC = getAssetPriceInUSDC(rewardTokenAddr);

  // index 0 is for the deposit reward
  const depositRewardPriceInUSDC = amountInUSD(
    rewardPriceInUSDC,
    rewardTokenDecimals,
    market.rewardTokenEmissionsAmount![0]
  );

  rewardEmissionsUSD[0] = depositRewardPriceInUSDC;

  // index 1 for the borrow reward
  const borrowRewardPriceInUSDC = amountInUSD(
    rewardPriceInUSDC,
    rewardTokenDecimals,
    market.rewardTokenEmissionsAmount![1]
  );
  rewardEmissionsUSD[1] = borrowRewardPriceInUSDC;

  return rewardEmissionsUSD;
}
