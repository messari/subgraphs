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
    market.lastRewardsUpdated &&
    !event.block.timestamp.minus(market.lastRewardsUpdated!).gt(TWELVE_HOURS)
  ) {
    return;
  }

  let tryIncentiveController = rTokenContract.try_getIncentivesController();
  if (tryIncentiveController.reverted) {
    return;
  }

  let incentiveController = ChefIncentivesController.bind(
    tryIncentiveController.value
  );
  let tryDepPoolInfo = incentiveController.try_poolInfo(
    Address.fromString(market.outputToken!)
  );
  let tryBorPoolInfo = incentiveController.try_poolInfo(
    Address.fromString(market.vToken!)
  );
  let tryTotalAllocPoint = incentiveController.try_totalAllocPoint();
  let tryTotalRewardsPerSecond = incentiveController.try_rewardsPerSecond();

  if (
    tryDepPoolInfo.reverted ||
    tryBorPoolInfo.reverted ||
    tryTotalAllocPoint.reverted ||
    tryTotalRewardsPerSecond.reverted
  ) {
    return;
  }

  // create reward tokens
  let borrowRewardToken = getOrCreateRewardToken(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    RewardTokenType.BORROW
  );
  let depositRewardToken = getOrCreateRewardToken(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    RewardTokenType.DEPOSIT
  );
  market.rewardTokens = [borrowRewardToken.id, depositRewardToken.id];

  // deposit rewards
  let depositRewardsPerSecond = tryTotalRewardsPerSecond.value
    .times(tryDepPoolInfo.value.value1)
    .div(tryTotalAllocPoint.value);
  let depositRewardsPerDay = depositRewardsPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  // borrow rewards
  let borrowRewardsPerSecond = tryTotalRewardsPerSecond.value
    .times(tryBorPoolInfo.value.value1)
    .div(tryTotalAllocPoint.value);
  let borrowRewardsPerDay = borrowRewardsPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );

  let rewardTokenPriceUSD = getRewardPrice();
  let depRewardsPerDayUSD = depositRewardsPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(rewardTokenPriceUSD);

  let borRewardsPerDayUSD = borrowRewardsPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(rewardTokenPriceUSD);

  // set rewards to arrays
  market.rewardTokenEmissionsAmount = [
    borrowRewardsPerDay,
    depositRewardsPerDay,
  ];
  market.rewardTokenEmissionsUSD = [borRewardsPerDayUSD, depRewardsPerDayUSD];
  market.lastRewardsUpdated = event.block.timestamp;
  market.save();
}

// Radiant price is generated from WETH-RDNT reserve on Sushiswap.
export function getRewardPrice(): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(RDNT_WETH_Uniswap_Pair));

  let reserves = pair.try_getReserves();
  if (reserves.reverted) {
    log.error("[getRewardPrice] Unable to get price for asset {}", [
      REWARD_TOKEN_ADDRESS,
    ]);
    return BIGDECIMAL_ZERO;
  }

  let reserveRDNT = reserves.value.value0;
  let reserveWETH = reserves.value.value1;

  let priceInWETH = reserveWETH.toBigDecimal().div(reserveRDNT.toBigDecimal());

  // get WETH price in USD from aToken contract.
  let rToken = RToken.bind(Address.fromString(RWETH_ADDRESS));
  let call = rToken.try_getAssetPrice();
  return call.reverted
    ? BIGDECIMAL_ZERO
    : call.value
        .toBigDecimal()
        .div(exponentToBigDecimal(rTOKEN_DECIMALS))
        .times(priceInWETH);
}
