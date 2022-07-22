import {
  StabilityPoolBalancesUpdated,
  StabilityPoolYUSDBalanceUpdated,
} from "../../generated/StabilityPool/StabilityPool";
import {
  getOrCreateYetiProtocol,
  updateProtocolLockedUSD,
} from "../entities/protocol";
import { getUSDPriceWithoutDecimals } from "../utils/price";
import { BIGDECIMAL_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

/**
 * Assets balance was updated
 *
 * @param event handleStabilityPoolBalancesUpdated event
 */
export function handleStabilityPoolBalancesUpdated (
  event: StabilityPoolBalancesUpdated
): void {
  const protocol = getOrCreateYetiProtocol();
  const oldAssetUSDLocked = protocol.totalStablePoolAssetUSD;
  let totalAssetLocked = BIGDECIMAL_ZERO;
  for (let i = 0; i < event.params.amounts.length; i++) {
    const asset = event.params.assets[i];
    const amount = event.params.amounts[i];
    totalAssetLocked = totalAssetLocked.plus(
      getUSDPriceWithoutDecimals(asset, amount.toBigDecimal())
    );
  }
  const totalValueLocked = protocol.totalValueLockedUSD.plus(
    totalAssetLocked.minus(oldAssetUSDLocked)
  );

  updateProtocolLockedUSD(event, totalValueLocked);
}

/**
 * YUSD balance was updated
 *
 * @param event StabilityPoolYUSDBalanceUpdated event
 */
export function handleStabilityPoolYUSDBalanceUpdated(
  event: StabilityPoolYUSDBalanceUpdated
): void {
  const totalYUSDLocked = event.params._newBalance;

  const protocol = getOrCreateYetiProtocol();
  const oldYUSDLockded = protocol.totalYUSDLocked;
  const totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    bigIntToBigDecimal(totalYUSDLocked.minus(oldYUSDLockded))
  );

  updateProtocolLockedUSD(event, totalValueLockedUSD);

  protocol.totalYUSDLocked = totalYUSDLocked;
  protocol.save();
}
