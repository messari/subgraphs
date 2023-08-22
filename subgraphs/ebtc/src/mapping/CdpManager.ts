import {
  CdpLiquidated,
  // CdpUpdated,
} from "../../generated/CdpManager/CdpManager";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../sdk/util/constants";
import { getDataManager, STETH_ADDRESS } from "../constants";
import { Address } from "@graphprotocol/graph-ts";
import { getUsdPrice } from "../prices";

/**
 * Make necessary adjustments to the system when a CDP changes.
 * @param event The event emitted by the CdpManager when a CDP changes.
 */
// export function handleCdpUpdated(event: CdpUpdated): void {
// TODO
// }

/**
 * Register a liquidation event.
 * @param event Liquidation The event emitted by the CdpManager when a CDP is
 * liquidated.
 */
export function handleCdpLiquidated(event: CdpLiquidated): void {
  const dataManager = getDataManager(event);
  dataManager.createLiquidate(
    STETH_ADDRESS, // asset: Bytes
    // TODO: liquidator address missing in event
    new Address(0), // liquidator: Address
    Address.fromBytes(event.params._borrower), // liquidatee: Address
    event.params._coll, // amount: BigInt
    getUsdPrice(
      Address.fromBytes(STETH_ADDRESS),
      event.params._coll.toBigDecimal(),
      event.block
    ), // amountUSD: BigDecimal
    // TODO: what is profit?
    getUsdPrice(Address.fromBytes(STETH_ADDRESS), BIGDECIMAL_ZERO, event.block), // profitUSD: BigDecimal
    // TODO: add logic for partial liquidations
    BIGINT_ZERO // newBalance: BigInt // repaid token balance for liquidatee
  );
}
