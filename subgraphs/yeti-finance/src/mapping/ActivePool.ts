import {
  ActivePoolYUSDDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import {  setMarketYUSDDebt } from "../entities/market";

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
