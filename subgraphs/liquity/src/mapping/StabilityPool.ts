import {
  ETHGainWithdrawn,
  StabilityPool,
  StabilityPoolETHBalanceUpdated,
  StabilityPoolLUSDBalanceUpdated,
  UserDepositChanged,
} from "../../generated/StabilityPool/StabilityPool";
import { getCurrentETHPrice, getCurrentLUSDPrice } from "../entities/token";
import { updateProtocolUSDLockedStabilityPool } from "../entities/protocol";
import { updateSPUserPositionBalances } from "../entities/position";
import { bigIntToBigDecimal } from "../utils/numbers";
import { createWithdraw } from "../entities/event";
import { getUsdPrice } from "../prices";
import { BIGINT_ZERO, ETH_ADDRESS } from "../utils/constants";
import { Address } from "@graphprotocol/graph-ts";
import { getOrCreateStabilityPool } from "../entities/market";

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
  const totalETHValue = bigIntToBigDecimal(totalETHLocked).times(
    getCurrentETHPrice()
  );

  const totalLUSDLocked = stabilityPool.getTotalLUSDDeposits();
  const LUSDValue = bigIntToBigDecimal(totalLUSDLocked).times(
    getCurrentLUSDPrice()
  );

  const totalValueLocked = totalETHValue.plus(LUSDValue);
  updateProtocolUSDLockedStabilityPool(
    event,
    totalLUSDLocked,
    totalValueLocked
  );
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
  const LUSDValue = bigIntToBigDecimal(totalLUSDLocked).times(
    getCurrentLUSDPrice()
  );
  const totalETHLocked = stabilityPool.getETH();
  const totalETHValue = bigIntToBigDecimal(totalETHLocked).times(
    getCurrentETHPrice()
  );

  const totalValueLocked = totalETHValue.plus(LUSDValue);
  updateProtocolUSDLockedStabilityPool(
    event,
    totalLUSDLocked,
    totalValueLocked
  );
}

/**
 * Triggered when some deposit balance changes. We use this to track position
 * value and deposits. But cannot accurately tell when it was caused by a withdrawal
 * or just by the transformation of LUSD into ETH due to liquidations (see stability pool docs).
 *
 * @param event UserDepositChanged
 */
export function handleUserDepositChanged(event: UserDepositChanged): void {
  // todo create deposit
  updateSPUserPositionBalances(
    event,
    event.params._depositor,
    event.params._newDeposit
  );
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

  const amountUSD = getUsdPrice(
    Address.fromString(ETH_ADDRESS),
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
}
