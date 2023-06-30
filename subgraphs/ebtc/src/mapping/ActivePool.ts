import {
  ActivePoolCollBalanceUpdated,
  ActivePoolEBTCDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { getDataManager, STETH_ADDRESS } from "../constants";
import { TokenManager } from "../sdk/token";

/**
 * Total stETH collateral was updated
 * @param event The ActivePoolCollBalanceUpdated event.
 */
export function handleActivePoolCollBalanceUpdated(
  event: ActivePoolCollBalanceUpdated
): void {
  const manager = getDataManager(event);
  const stEthToken = new TokenManager(STETH_ADDRESS, event);
  manager.updateMarketAndProtocolData(
    stEthToken.getPriceUSD(), // inputTokenPriceUSD: BigDecimal,
    event.params._coll // newInputTokenBalance: BigInt,
  );
}

/**
 * Total eBTC debt was updated
 * @param event The ActivePoolEBTCDebtUpdated event.
 */
export function handleActivePoolEBTCDebtUpdated(
  event: ActivePoolEBTCDebtUpdated
): void {
  const manager = getDataManager(event);
  const market = manager.getMarket();
  const stEthToken = new TokenManager(STETH_ADDRESS, event);
  manager.updateMarketAndProtocolData(
    stEthToken.getPriceUSD(), // inputTokenPriceUSD: BigDecimal,
    market.inputTokenBalance, // newInputTokenBalance: BigInt,
    event.params._EBTCDebt // newVariableBorrowBalance: BigInt | null = null,
  );
}
