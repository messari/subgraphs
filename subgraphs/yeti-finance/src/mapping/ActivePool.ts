import {
  ActivePoolBalancesUpdated,
  ActivePoolBalanceUpdated,
  ActivePoolYUSDDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { setMarketAssetBalance, setMarketYUSDDebt } from "../entities/market";

/**
 * Total Assets collateral was updated
 *
 * @param event ActivePoolAssetsBalanceUpdated event
 */
export function handleActivePoolAssetsBalanceUpdated(
  event: ActivePoolBalancesUpdated
): void {
  for (let i = 0; i < event.params._amounts.length; i++) {
    setMarketAssetBalance(
      event,
      event.params._amounts[i],
      event.params._collaterals[i]
    );
  }
}

/**
 * Total Asset collateral was updated
 *
 * @param event ActivePoolAssetBalanceUpdated event
 */
export function handleActivePoolAssetBalanceUpdated(
  event: ActivePoolBalanceUpdated
): void {
  setMarketAssetBalance(event, event.params._amount, event.params._collateral);
}

/**
 * YUSD debt was updated
 *
 * @param event ActivePoolYUSDDebtUpdated event
 */
export function handleActivePoolYUSDDebtUpdated(
  event: ActivePoolYUSDDebtUpdated
): void {
  setMarketYUSDDebt(event, event.params._YUSDDebt);
}
