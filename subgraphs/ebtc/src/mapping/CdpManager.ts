import { CdpUpdated, Liquidation } from "../../generated/CdpManager/CdpManager";
import { BIGINT_ZERO } from "../sdk/util/constants";
import { getDataManager, STETH_ADDRESS } from "../constants";
import { Address } from "@graphprotocol/graph-ts";
import { getUsdPrice } from "../prices";

/**
 * Make necessary adjustments to the system when a CDP changes.
 * @param event The event emitted by the CdpManager when a CDP changes.
 */
export function handleCdpUpdated(event: CdpUpdated): void {
  // TODO
}

/**
 * Register a liquidation event.
 * @param event Liquidation The event emitted by the CdpManager when a CDP is
 * liquidated.
 */
export function handleLiquidation(event: Liquidation): void {
  // TODO: event is missing the following data points:
  // - liquidator
  // - liquidatee
  // - newBalance
  const dataManager = getDataManager(event);
  dataManager.createLiquidate(
    STETH_ADDRESS, // asset: Bytes
    new Address(0), // liquidator: Address
    new Address(0), // liquidatee: Address
    event.params._liquidatedColl, // amount: BigInt
    getUsdPrice(
      Address.fromBytes(STETH_ADDRESS),
      event.params._liquidatedColl.toBigDecimal(),
      event.block
    ), // amountUSD: BigDecimal
    getUsdPrice(
      Address.fromBytes(STETH_ADDRESS),
      event.params._liqReward.toBigDecimal(),
      event.block
    ), // profitUSD: BigDecimal
    BIGINT_ZERO // newBalance: BigInt // repaid token balance for liquidatee
  );
}
