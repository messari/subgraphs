import {
  ETHGainWithdrawn,
  StabilityPool,
  StabilityPoolETHBalanceUpdated,
  StabilityPoolLUSDBalanceUpdated,
  UserDepositChanged,
} from "../../generated/StabilityPool/StabilityPool";
import {
  getCurrentETHPrice,
  getCurrentLQTYPrice,
  getRewardToken,
} from "../entities/token";
import { updateProtocolUSDLockedStabilityPool } from "../entities/protocol";
import { updateSPUserPositionBalances } from "../entities/position";
import { bigIntToBigDecimal } from "../utils/numbers";
import { createWithdraw } from "../entities/event";
import {
  BIGDECIMAL_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
} from "../utils/constants";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketSnapshot,
  getOrCreateStabilityPool,
} from "../entities/market";
import { Market } from "../../generated/schema";
import {
  STABILITY_POOL_LQTY_ISSUANCE_FACTOR,
  STABILITY_POOL_LQTY_BUGDET,
  STABILITY_POOL_REWARD_START,
} from "../utils/constants";

/**
 * ETH balance was updated
 *
 * @param event StabilityPoolETHBalanceUpdated event
 */
export function handleStabilityPoolETHBalanceUpdated(
  event: StabilityPoolETHBalanceUpdated
): void {
  const stabilityPool = StabilityPool.bind(event.address);
  const totalETHLocked = event.params._newBalance;
  const totalLUSDLocked = stabilityPool.getTotalLUSDDeposits();
  updateProtocolUSDLockedStabilityPool(event, totalLUSDLocked, totalETHLocked);
  calculateDailyLQTYRewards(event, getOrCreateStabilityPool(event));
}

/**
 * LUSD balance was updated
 *
 * @param event StabilityPoolLUSDBalanceUpdated event
 */
export function handleStabilityPoolLUSDBalanceUpdated(
  event: StabilityPoolLUSDBalanceUpdated
): void {
  const stabilityPool = StabilityPool.bind(event.address);
  const totalLUSDLocked = event.params._newBalance;
  const totalETHLocked = stabilityPool.getETH();
  updateProtocolUSDLockedStabilityPool(event, totalLUSDLocked, totalETHLocked);
  calculateDailyLQTYRewards(event, getOrCreateStabilityPool(event));
}

/**
 * Triggered when some deposit balance changes. We use this to track position
 * value and deposits. But cannot accurately tell when it was caused by a withdrawal
 * or just by the transformation of LUSD into ETH due to liquidations (see stability pool docs).
 *
 * @param event UserDepositChanged
 */
export function handleUserDepositChanged(event: UserDepositChanged): void {
  const market = getOrCreateStabilityPool(event);
  updateSPUserPositionBalances(
    event,
    market,
    event.params._depositor,
    event.params._newDeposit
  );
  calculateDailyLQTYRewards(event, market);
}

/**
 * Triggered when ETH that has been converted from LUSD in the stability pool
 * is sent to its owner (the LUSD depositor).
 * These are the only StabilityPool withdrawals we are able to track.
 *
 * @param event ETHGainWithdrawn
 */
export function handleETHGainWithdrawn(event: ETHGainWithdrawn): void {
  if (event.params._ETH.equals(BIGINT_ZERO)) {
    return;
  }

  const amountUSD = getCurrentETHPrice().times(
    bigIntToBigDecimal(event.params._ETH)
  );
  const market = getOrCreateStabilityPool(event);
  createWithdraw(
    event,
    market,
    event.params._ETH,
    amountUSD,
    event.params._depositor,
    event.params._depositor
  );
  calculateDailyLQTYRewards(event, market);
}

/**
 * Calculates and sets estimated LQTY rewards for the stability pool.
 * Rewards aren't issued linearly, they follow the formula:
 *
 * totalRewardsToDate = rewardBudget * (1 - issuanceFactor ^ minutesSinceDeployment)
 *
 * rewardBudget and issuanceFactor are constants, so we can calculate the rewards without the contracts themselves.
 * To calculate the rewards issued daily, we just need to calculate the difference of `totalRewardsToDate` between now and 24 in the future.
 *
 * @param event
 * @param market
 */
function calculateDailyLQTYRewards(
  event: ethereum.Event,
  market: Market
): void {
  const minutesSinceDeployment = event.block.timestamp
    .minus(STABILITY_POOL_REWARD_START)
    .div(BigInt.fromI32(60));
  const minutesInADay = BigInt.fromI32(60 * 24);

  const totalRewardsToDate = minutesToRewards(minutesSinceDeployment.toU32());
  const totalRewardsTomorrow = minutesToRewards(
    minutesSinceDeployment.plus(minutesInADay).toU32()
  );

  const dailyLQTYRewards = totalRewardsTomorrow.minus(totalRewardsToDate);
  const rewardsUSD = bigIntToBigDecimal(dailyLQTYRewards).times(
    getCurrentLQTYPrice()
  );
  market.rewardTokens = [getRewardToken().id];
  market.rewardTokenEmissionsAmount = [dailyLQTYRewards];
  market.rewardTokenEmissionsUSD = [rewardsUSD];
  market.save();

  // update snapshots
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

function minutesToRewards(minutes: u32): BigInt {
  const pow = bigPow(STABILITY_POOL_LQTY_ISSUANCE_FACTOR, minutes);
  const fraction = BIGDECIMAL_ONE.minus(pow);
  const rewards = STABILITY_POOL_LQTY_BUGDET.times(fraction);
  // to big int by multiplying by 10^18, truncate, then to string and from string.
  return BigInt.fromString(
    rewards
      .times(BIGINT_TEN.pow(DEFAULT_DECIMALS as u8).toBigDecimal())
      .truncate(0)
      .toString()
  );
}

// exponentiation by squaring
// we use this custom function because BigInt.pow is limited to u8 (max 255) exponents.
// https://github.com/liquity/dev/blob/main/packages/contracts/contracts/Dependencies/LiquityMath.sol#L63
function bigPow(base: BigDecimal, exponent: u32): BigDecimal {
  let x = base;
  let y = BIGDECIMAL_ONE;
  let n = exponent;

  while (n > 1) {
    if (n % 2 == 0) {
      x = x.times(x);
      n = n / 2;
    } else {
      y = y.times(x);
      x = x.times(x);
      n = (n - 1) / 2;
    }
  }

  return x.times(y);
}
