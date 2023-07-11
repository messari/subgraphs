import { Address } from "@graphprotocol/graph-ts";
import {
  ActivePoolCollBalanceUpdated,
  ActivePoolEBTCDebtUpdated,
  FlashLoanSuccess,
} from "../../generated/ActivePool/ActivePool";
import { getDataManager, STETH_ADDRESS } from "../constants";
import { TokenManager } from "../sdk/token";
import { getUsdPrice } from "../prices";
import { BIGINT_TEN_TO_EIGHTEENTH } from "../sdk/util/constants";

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
    stEthToken.getPriceUSD(), // inputTokenPriceUSD: BigDecimal
    event.params._coll // newInputTokenBalance: BigInt
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
    stEthToken.getPriceUSD(), // inputTokenPriceUSD: BigDecimal
    market.inputTokenBalance, // newInputTokenBalance: BigInt
    event.params._EBTCDebt // newVariableBorrowBalance: BigInt | null = null
  );
}

/**
 * Create a flashloan object and handle its fee when a flashloan is successful.
 * @param event FlashLoanSuccess The event emitted by BorrowerOperations when
 * a flashloan is successful.
 */
export function handleFlashLoanSuccess(event: FlashLoanSuccess): void {
  const dataManager = getDataManager(event);
  const flashloan = dataManager.createFlashloan(
    Address.fromBytes(STETH_ADDRESS), // asset: Address
    event.params._receiver, // account: Address
    event.params._amount, // amount: BigInt
    getUsdPrice(
      Address.fromBytes(STETH_ADDRESS),
      event.params._amount.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
      event.block
    ) // amountUSD: BigDecimal
  );
  // TODO: handle fee (event.params._fee)
}
