import {
  StabilityPool,
  StabilityPoolETHBalanceUpdated,
  StabilityPoolLUSDBalanceUpdated,
} from "../../generated/StabilityPool/StabilityPool";
import { getCurrentETHPrice } from "../entities/price";
import { updateUSDLockedStabilityPool } from "../entities/protocol";
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
  const totalLUSDLocked = stabilityPool.getTotalLUSDDeposits();
  const totalValueLocked = bigIntToBigDecimal(totalETHLocked)
    .times(getCurrentETHPrice())
    .plus(bigIntToBigDecimal(totalLUSDLocked));
  updateUSDLockedStabilityPool(event, totalValueLocked);
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
  const totalValueLocked = bigIntToBigDecimal(totalETHLocked)
    .times(getCurrentETHPrice())
    .plus(bigIntToBigDecimal(totalLUSDLocked));
  updateUSDLockedStabilityPool(event, totalValueLocked);
}
