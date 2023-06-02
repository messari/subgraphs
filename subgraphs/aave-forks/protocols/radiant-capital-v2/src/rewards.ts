import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { getRewardConfig, rTOKEN_DECIMALS } from "./constants";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
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
import { ERC20 } from "../../../generated/LendingPool/ERC20";

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

  const rewardConfig = getRewardConfig();

  // create reward tokens
  const borrowRewardToken = getOrCreateRewardToken(
    Address.fromString(rewardConfig.rewardTokenAddress),
    RewardTokenType.BORROW
  );
  const depositRewardToken = getOrCreateRewardToken(
    Address.fromString(rewardConfig.rewardTokenAddress),
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

// get the price of RDNT by comparing the balance of RDNT to WETH in the uniswap pool and normalizing using the WETH USD price
export function getRewardPrice(): BigDecimal {
  const rewardConfig = getRewardConfig();

  const rdntAddress = ERC20.bind(
    Address.fromString(rewardConfig.rewardTokenAddress)
  );
  const wethAddress = ERC20.bind(
    Address.fromString(rewardConfig.otherPoolTokenAddress)
  );
  const tryRdntBalance = rdntAddress.try_balanceOf(
    Address.fromString(rewardConfig.poolAddress)
  );
  const tryWethBalance = wethAddress.try_balanceOf(
    Address.fromString(rewardConfig.poolAddress)
  );
  if (tryRdntBalance.reverted || tryWethBalance.reverted) {
    log.error("[getRewardPrice] Unable to get balances from pool {}", [
      rewardConfig.poolAddress,
    ]);
    return BIGDECIMAL_ZERO;
  }

  const reserveRDNT = tryRdntBalance.value;
  const reserveWETH = tryWethBalance.value;

  // div by 0 error handle
  if (reserveRDNT.equals(BIGINT_ZERO) || reserveWETH.equals(BIGINT_ZERO)) {
    return BIGDECIMAL_ZERO;
  }

  const priceInWETH = reserveWETH
    .toBigDecimal()
    .div(reserveRDNT.toBigDecimal());

  // get WETH price in USD from aToken contract.
  const rToken = RToken.bind(Address.fromString(rewardConfig.rTokenMarket));
  const call = rToken.try_getAssetPrice();
  return call.reverted
    ? BIGDECIMAL_ZERO
    : call.value
        .toBigDecimal()
        .div(exponentToBigDecimal(rTOKEN_DECIMALS))
        .times(priceInWETH);
}
