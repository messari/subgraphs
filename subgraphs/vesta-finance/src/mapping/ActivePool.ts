import { Address, log } from "@graphprotocol/graph-ts";
import {
  ActivePoolAssetBalanceUpdated,
  ActivePoolVSTDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { PriceFeedV1 } from "../../generated/templates";
import { setMarketAssetBalance, setMarketVSTDebt } from "../entities/market";
import {
  getOrCreateLendingProtocol,
  updateProtocolPriceOracle,
} from "../entities/protocol";
import { EMPTY_STRING, PRICE_ORACLE_V1_ADDRESS } from "../utils/constants";

/**
 * Total Asset collateral was updated
 *
 * @param event ActivePoolAssetBalanceUpdated event
 */
export function handleActivePoolAssetBalanceUpdated(
  event: ActivePoolAssetBalanceUpdated
): void {
  if (getOrCreateLendingProtocol()._priceOracle == EMPTY_STRING) {
    updateProtocolPriceOracle(PRICE_ORACLE_V1_ADDRESS);
    PriceFeedV1.create(Address.fromString(PRICE_ORACLE_V1_ADDRESS));
  }

  setMarketAssetBalance(event, event.params._asset, event.params._balance);
}

/**
 * VST debt was updated
 *
 * @param event ActivePoolVSTDebtUpdated event
 */
export function handleActivePoolVSTDebtUpdated(
  event: ActivePoolVSTDebtUpdated
): void {
  setMarketVSTDebt(event, event.params._asset, event.params._VSTDebt);
}
