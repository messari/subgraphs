import { Address, log } from "@graphprotocol/graph-ts";
import {
  ActivePool,
  ActivePoolCollBalanceUpdated,
  ActivePoolEBTCDebtUpdated,
  CdpManagerAddressChanged,
  FlashLoanSuccess,
} from "../../generated/ActivePool/ActivePool";
import {
  ACTIVE_POOL,
  EBTC_ADDRESS,
  LIQUIDATION_FEE_PERCENT,
  MAXIMUM_LTV,
  STETH_ADDRESS,
  getDataManager,
} from "../constants";
import { TokenManager } from "../sdk/token";
import { getUsdPrice } from "../prices";
import { BIGINT_TEN_TO_EIGHTEENTH } from "../sdk/util/constants";

/**
 * On deployment of the pool, initialise and populate the market,
 * lendingProtocol and oracle entities.
 * @param event An event emitted by the constructor of the ActivePool proving
 * it was deployed successfully.
 */
export function handleSystemDeployed(event: CdpManagerAddressChanged): void {
  const activePool = ActivePool.bind(event.address);
  if (activePool._address != ACTIVE_POOL) {
    // quick check to make sure our configurations.json is correct
    log.error(
      "deployed ActivePool address {} does not match expected address",
      [event.address.toHexString()]
    );
    return;
  }

  const dataManager = getDataManager(event);

  // update market with ebtc specifics
  const market = dataManager.getMarket();
  market.canBorrowFrom = true;
  market.maximumLTV = MAXIMUM_LTV;
  market.liquidationThreshold = MAXIMUM_LTV;
  market.liquidationPenalty = LIQUIDATION_FEE_PERCENT;
  market.borrowedToken = EBTC_ADDRESS;
  market.save();
}

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
  dataManager.createFlashloan(
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
