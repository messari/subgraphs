import {
  StabilityPool,
  StabilityPoolETHBalanceUpdated,
  StabilityPoolYUSDBalanceUpdated,
} from "../../generated/StabilityPool/StabilityPool";
import { updateProtocoyUSDLockedStabilityPool } from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";


/**
 * YUSD balance was updated
 *
 * @param event StabilityPoolYUSDBalanceUpdated event
 */
export function handleStabilityPoolYUSDBalanceUpdated(
  event: StabilityPoolYUSDBalanceUpdated
): void {
  const stabilityPool = StabilityPool.bind(event.address);
  const totalYUSDLocked = event.params._newBalance;
  const totalETHLocked = stabilityPool.getETH();
  const totalValueLocked = bigIntToBigDecimal(totalETHLocked)
    .times(getCurrentETHPrice())
    .plus(bigIntToBigDecimal(totalYUSDLocked));
  updateProtocoyUSDLockedStabilityPool(event, totalValueLocked);
}
