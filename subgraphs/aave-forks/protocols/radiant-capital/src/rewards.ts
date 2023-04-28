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
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { ReserveDataUpdated } from "../../../generated/LendingPool/LendingPool";
import { RToken } from "../../../generated/LendingPool/RToken";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { UniswapV2Pair } from "../../../generated/LendingPool/UniswapV2Pair";
import { DataManager, RewardData } from "../../../src/sdk/manager";
import { TokenManager } from "../../../src/sdk/token";
import { exponentToBigDecimal } from "../../../src/helpers";
import { RewardTokenType } from "../../../src/sdk/constants";

export function updateMarketRewards(
  manager: DataManager,
  event: ReserveDataUpdated,
  rTokenContract: RToken
): void {
  const market = manager.getMarket();
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
    Address.fromBytes(market.outputToken!)
  );
  const tryBorPoolInfo = incentiveController.try_poolInfo(
    Address.fromBytes(market._vToken!)
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
  const rewardTokenManager = new TokenManager(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    event
  );

  const rewardTokenVariableBorrow = rewardTokenManager.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const rewardTokenStableBorrow = rewardTokenManager.getOrCreateRewardToken(
    RewardTokenType.STABLE_BORROW
  );
  const rewardTokenDeposit = rewardTokenManager.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );

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

  const rewardDataVariableBorrow = new RewardData(
    rewardTokenVariableBorrow,
    borrowRewardsPerDay,
    borRewardsPerDayUSD
  );
  const rewardDataStableBorrow = new RewardData(
    rewardTokenStableBorrow,
    borrowRewardsPerDay,
    borRewardsPerDayUSD
  );
  const rewardDataDeposit = new RewardData(
    rewardTokenDeposit,
    depositRewardsPerDay,
    depRewardsPerDayUSD
  );
  manager.updateRewards(rewardDataVariableBorrow);
  manager.updateRewards(rewardDataStableBorrow);
  manager.updateRewards(rewardDataDeposit);

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
