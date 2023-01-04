import {
  ActivePoolAssetBalanceUpdated,
  ActivePoolVSTDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { setMarketAssetBalance, setMarketVSTDebt } from "../entities/market";

/**
 * Total Asset collateral was updated
 *
 * @param event ActivePoolAssetBalanceUpdated event
 */
export function handleActivePoolAssetBalanceUpdated(
  event: ActivePoolAssetBalanceUpdated
): void {
  const asset = event.params._asset;
  setMarketAssetBalance(event, asset, event.params._balance);
}

/**
 * VST debt was updated
 *
 * @param event ActivePoolVSTDebtUpdated event
 */
export function handleActivePoolVSTDebtUpdated(
  event: ActivePoolVSTDebtUpdated
): void {
  setMarketVSTDebt(event, event.params._asset, event.params._VSTDebt);
}
