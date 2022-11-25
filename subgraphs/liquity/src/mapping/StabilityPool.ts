import {
  StabilityPool,
  StabilityPoolETHBalanceUpdated,
  StabilityPoolLUSDBalanceUpdated,
  UserDepositChanged,
} from "../../generated/StabilityPool/StabilityPool";
import { getCurrentETHPrice, getCurrentLUSDPrice } from "../entities/token";
import { updateProtocolUSDLockedStabilityPool } from "../entities/protocol";
import { updateSPUserPositionBalances } from "../entities/position";
import { bigIntToBigDecimal } from "../utils/numbers";

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
  updateSPUserPositionBalances(
    event,
    event.params._depositor,
    event.params._newDeposit
  );
}
