import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RDNT_WETH_Uniswap_Pair,
  RWETH_ADDRESS,
  REWARD_TOKEN_ADDRESS,
  rTOKEN_DECIMALS,
} from "./constants";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { ReserveDataUpdated } from "../../../generated/LendingPool/LendingPool";
import { RToken } from "../../../generated/LendingPool/RToken";
import { getOrCreateRewardToken } from "../../../src/helpers";
import { Market } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { UniswapV2Pair } from "../../../generated/LendingPool/UniswapV2Pair";

export function updateMarketRewards(
  event: ReserveDataUpdated,
  market: Market,
  rTokenContract: RToken
): void {
  const TWELVE_HOURS = BigInt.fromI32(SECONDS_PER_DAY / 2);
  if (
    market._lastRewardsUpdated &&
    !event.block.timestamp.minus(market._lastRewardsUpdated!).gt(TWELVE_HOURS)
  ) {
    return;
  }

  const tryIncentiveController = rTokenContract.try_getIncentivesController();
  if (tryIncentiveController.reverted) {
    return;
  }

  const incentiveController = ChefIncentivesController.bind(
    tryIncentiveController.value
  );
  const tryDepPoolInfo = incentiveController.try_poolInfo(
    Address.fromString(market.outputToken!)
  );
  const tryBorPoolInfo = incentiveController.try_poolInfo(
    Address.fromString(market._vToken!)
  );
  const tryTotalAllocPoint = incentiveController.try_totalAllocPoint();
  const tryTotalRewardsPerSecond = incentiveController.try_rewardsPerSecond();

  if (
    tryDepPoolInfo.reverted ||
    tryBorPoolInfo.reverted ||
    tryTotalAllocPoint.reverted ||
    tryTotalRewardsPerSecond.reverted
  ) {
    return;
  }

  // create reward tokens
  const borrowRewardToken = getOrCreateRewardToken(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    RewardTokenType.BORROW
  );
  const depositRewardToken = getOrCreateRewardToken(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    RewardTokenType.DEPOSIT
  );
  market.rewardTokens = [borrowRewardToken.id, depositRewardToken.id];

  // deposit rewards
  const depositRewardsPerSecond = tryTotalRewardsPerSecond.value
    .times(tryDepPoolInfo.value.value1)
    .div(tryTotalAllocPoint.value);
  const depositRewardsPerDay = depositRewardsPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  // borrow rewards
  const borrowRewardsPerSecond = tryTotalRewardsPerSecond.value
    .times(tryBorPoolInfo.value.value1)
    .div(tryTotalAllocPoint.value);
  const borrowRewardsPerDay = borrowRewardsPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );

  const rewardTokenPriceUSD = getRewardPrice();
  const depRewardsPerDayUSD = depositRewardsPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(rewardTokenPriceUSD);

  const borRewardsPerDayUSD = borrowRewardsPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(rewardTokenPriceUSD);

  // set rewards to arrays
  market.rewardTokenEmissionsAmount = [
    borrowRewardsPerDay,
    depositRewardsPerDay,
  ];
  market.rewardTokenEmissionsUSD = [borRewardsPerDayUSD, depRewardsPerDayUSD];
  market._lastRewardsUpdated = event.block.timestamp;
  market.save();
}

// Radiant price is generated from WETH-RDNT reserve on Sushiswap.
export function getRewardPrice(): BigDecimal {
  const pair = UniswapV2Pair.bind(Address.fromString(RDNT_WETH_Uniswap_Pair));

  const reserves = pair.try_getReserves();
  if (reserves.reverted) {
    log.error("[getRewardPrice] Unable to get price for asset {}", [
      REWARD_TOKEN_ADDRESS,
    ]);
    return BIGDECIMAL_ZERO;
  }

  const reserveRDNT = reserves.value.value0;
  const reserveWETH = reserves.value.value1;

  const priceInWETH = reserveWETH
    .toBigDecimal()
    .div(reserveRDNT.toBigDecimal());

  // get WETH price in USD from aToken contract.
  const rToken = RToken.bind(Address.fromString(RWETH_ADDRESS));
  const call = rToken.try_getAssetPrice();
  return call.reverted
    ? BIGDECIMAL_ZERO
    : call.value
        .toBigDecimal()
        .div(exponentToBigDecimal(rTOKEN_DECIMALS))
        .times(priceInWETH);
}
