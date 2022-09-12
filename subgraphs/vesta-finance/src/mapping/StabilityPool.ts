import {
  StabilityPool,
  StabilityPoolAssetBalanceUpdated,
  StabilityPoolVSTBalanceUpdated,
} from "../../generated/StabilityPool/StabilityPool";
import { getCurrentAssetPrice } from "../entities/token";
import { updateProtocolUSDLockedStabilityPool } from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";

/**
 * Asset balance was updated
 *
 * @param event StabilityPoolAssetBalanceUpdated event
 */
export function handleStabilityPoolAssetBalanceUpdated(
  event: StabilityPoolAssetBalanceUpdated
): void {
  const stabilityPool = StabilityPool.bind(event.address);
  const asset = stabilityPool.getAssetType();
  const totalAssetLocked = event.params._newBalance;
  const totalVSTLocked = stabilityPool.getTotalVSTDeposits();
  const totalValueLocked = bigIntToBigDecimal(totalAssetLocked)
    .times(getCurrentAssetPrice(asset))
    .plus(bigIntToBigDecimal(totalVSTLocked));
  updateProtocolUSDLockedStabilityPool(event, asset, totalValueLocked);
}

/**
 * VST balance was updated
 *
 * @param event StabilityPoolVSTBalanceUpdated event
 */
export function handleStabilityPoolVSTBalanceUpdated(
  event: StabilityPoolVSTBalanceUpdated
): void {
  const stabilityPool = StabilityPool.bind(event.address);
  const asset = stabilityPool.getAssetType();
  const totalAssetLocked = stabilityPool.getAssetBalance();
  const totalVSTLocked = event.params._newBalance;
  const totalValueLocked = bigIntToBigDecimal(totalAssetLocked)
    .times(getCurrentAssetPrice(asset))
    .plus(bigIntToBigDecimal(totalVSTLocked));
  updateProtocolUSDLockedStabilityPool(event, asset, totalValueLocked);
}
