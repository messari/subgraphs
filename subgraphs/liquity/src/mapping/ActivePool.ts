import {
  ActivePoolETHBalanceUpdated,
  ActivePoolLUSDDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { setMarketETHBalance, setMarketLUSDDebt } from "../entities/market";

/**
 * Total ETH collateral was updated
 *
 * @param event ActivePoolETHBalanceUpdated event
 */
export function handleActivePoolETHBalanceUpdated(
  event: ActivePoolETHBalanceUpdated
): void {
  setMarketETHBalance(event, event.params._ETH);
}

/**
 * LUSD debt was updated
 *
 * @param event ActivePoolLUSDDebtUpdated event
 */
export function handleActivePoolLUSDDebtUpdated(
  event: ActivePoolLUSDDebtUpdated
): void {
  setMarketLUSDDebt(event, event.params._LUSDDebt);
}
