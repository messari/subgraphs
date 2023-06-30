import {
  ActivePoolCollBalanceUpdated,
  ActivePoolEBTCDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
// import { setMarketCollBalance, setMarketEBTCDebt } from "../entities/market";

/**
 * Total stETH collateral was updated
 *
 * @param event ActivePoolCollBalanceUpdated event
 */
export function handleActivePoolCollBalanceUpdated(
  event: ActivePoolCollBalanceUpdated
): void {
  // setMarketCollBalance(event, event.params._coll);
}

/**
 * EBTC debt was updated
 *
 * @param event ActivePoolEBTCDebtUpdated event
 */
export function handleActivePoolEBTCDebtUpdated(
  event: ActivePoolEBTCDebtUpdated
): void {
  // setMarketEBTCDebt(event, event.params._EBTCDebt);
}
