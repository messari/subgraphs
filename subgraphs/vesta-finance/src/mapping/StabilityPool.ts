import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  StabilityPool,
  StabilityPoolAssetBalanceUpdated,
  StabilityPoolVSTBalanceUpdated,
} from "../../generated/ETHStabilityPool/StabilityPool";
import { getCurrentAssetPrice } from "../entities/token";
import { updateProtocolUSDLockedStabilityPool } from "../entities/protocol";
import { getOrCreateStabilityPool } from "../entities/stabilitypool";
import { bigIntToBigDecimal } from "../utils/numbers";
/**
 * Asset balance was updated
 *
 * @param event StabilityPoolAssetBalanceUpdated event
 */
export function handleStabilityPoolAssetBalanceUpdated(
  event: StabilityPoolAssetBalanceUpdated
): void {
  handleStabilityPoolBalanceUpdated(event, event.params._newBalance, true);
}

/**
 * VST balance was updated
 *
 * @param event StabilityPoolVSTBalanceUpdated event
 */
export function handleStabilityPoolVSTBalanceUpdated(
  event: StabilityPoolVSTBalanceUpdated
): void {
  handleStabilityPoolBalanceUpdated(event, event.params._newBalance, false);
}

function handleStabilityPoolBalanceUpdated(
  event: ethereum.Event,
  newBalance: BigInt,
  isAssetBalanceUpdated: bool
): void {
  const stabilityPoolContract = StabilityPool.bind(event.address);
  const asset = stabilityPoolContract.getAssetType();
  let totalAssetLocked: BigInt;
  let totalVSTLocked: BigInt;

  if (isAssetBalanceUpdated) {
    totalAssetLocked = newBalance;
    totalVSTLocked = stabilityPoolContract.getTotalVSTDeposits();
  } else {
    totalAssetLocked = stabilityPoolContract.getAssetBalance();
    totalVSTLocked = newBalance;
  }

  const totalValueLocked = bigIntToBigDecimal(totalAssetLocked)
    .times(getCurrentAssetPrice(asset))
    .plus(bigIntToBigDecimal(totalVSTLocked));

  const stabilityPool = getOrCreateStabilityPool(asset);
  const previousTotalValueLocked = stabilityPool.totalValueLocked;
  stabilityPool.totalValueLocked = totalValueLocked;
  updateProtocolUSDLockedStabilityPool(
    event,
    asset,
    totalValueLocked.minus(previousTotalValueLocked)
  );
}
