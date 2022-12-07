import { Address } from "@graphprotocol/graph-ts";
import {
  ActivePoolAssetBalanceUpdated,
  ActivePoolVSTDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { StabilityPool } from "../../generated/templates";
import { StabilityPoolManager } from "../../generated/ActivePool/StabilityPoolManager";
import { setMarketAssetBalance, setMarketVSTDebt } from "../entities/market";
import {
  getOrCreateLendingProtocol,
  updateProtocolPriceOracle,
} from "../entities/protocol";

import {
  EMPTY_STRING,
  PRICE_ORACLE_V1_ADDRESS,
  STABILITY_POOL_MANAGER,
} from "../utils/constants";

/**
 * Total Asset collateral was updated
 *
 * @param event ActivePoolAssetBalanceUpdated event
 */
export function handleActivePoolAssetBalanceUpdated(
  event: ActivePoolAssetBalanceUpdated
): void {
  const asset = event.params._asset;
  setMarketAssetBalance(event, asset, event.params._balance);
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
