import {
  ActivePoolETHBalanceUpdated,
  ActivePoolLUSDDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { setMarketETHBalance, setMarketLUSDDebt } from "../entities/market";

export function handleActivePoolETHBalanceUpdated(
  event: ActivePoolETHBalanceUpdated
): void {
  setMarketETHBalance(event, event.params._ETH);
}

export function handleActivePoolLUSDDebtUpdated(
  event: ActivePoolLUSDDebtUpdated
): void {
  setMarketLUSDDebt(event, event.params._LUSDDebt);
}
