import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { REWARD_TOKEN_ADDRESS } from "./constants";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { ReserveDataUpdated } from "../../../generated/LendingPool/LendingPool";
import { RToken } from "../../../generated/LendingPool/RToken";
import { getOrCreateRewardToken, getOrCreateToken } from "../../../src/helpers";
import { Market, Token } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import {
  UniswapV3Pool,
  Swap,
} from "../../../generated/UniswapV3Pool/UniswapV3Pool";
import {
  exponentToBigInt,
  PRECISION,
  Q192,
  safeDiv,
} from "../../radiant-capital-v2/src/constants";

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

  let rewardTokenPriceUSD = getOrCreateToken(
    Address.fromString(depositRewardToken.token)
  ).lastPriceUSD;
  if (!rewardTokenPriceUSD) {
    rewardTokenPriceUSD = BIGDECIMAL_ZERO;
  }
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

// This handler updates RDNT price
export function handleSwap(event: Swap): void {
  const poolContract = UniswapV3Pool.bind(event.address);
  const tryToken0 = poolContract.try_token0();
  const tryToken1 = poolContract.try_token1();
  if (tryToken0.reverted || tryToken1.reverted) {
    log.error("[handleSwap] Unable to get token0 or token1 from pool {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  const token0 = getOrCreateToken(tryToken0.value); // RDNT
  const token1 = getOrCreateToken(tryToken1.value); // WETH
  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1
  );

  token0.lastPriceUSD = prices[0];
  token0.lastPriceBlockNumber = event.block.number;
  token0.save();
}

function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0: Token,
  token1: Token
): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96);
  const denom = Q192;
  const price1 = num
    .times(PRECISION)
    .div(denom)
    .times(exponentToBigInt(token0.decimals))
    .div(exponentToBigInt(token1.decimals))
    .toBigDecimal()
    .div(PRECISION.toBigDecimal());

  const price0 = safeDiv(BIGDECIMAL_ONE, price1);

  return [price0, price1];
}
