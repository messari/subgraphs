import { PairCreated } from "../../generated/Factory/Factory";
import { _HelperStore } from "../../generated/schema";
import { Pool } from "../../generated/templates";
import { getOrCreatePool } from "../helpers/pool";
import { BIGDECIMAL_ZERO, HELPER_STORE_ID } from "../utils/constant";
import { getOrCreateToken } from "../utils/token";

export function handlePairCreated(event: PairCreated): void {
  let pairAddress = event.params.pair;
  let token0Address = event.params.token0;
  let token1Address = event.params.token1;
  // create new bundle, if it doesn't already exist
  let helperStore = _HelperStore.load(HELPER_STORE_ID);
  if (helperStore == null) {
    let helperStore = new _HelperStore(HELPER_STORE_ID);
    helperStore._value = BIGDECIMAL_ZERO;
    helperStore.save();
  }
  // Create Tokens
  let token0 = getOrCreateToken(token0Address);
  let token1 = getOrCreateToken(token1Address);
  // Create pair
  getOrCreatePool(event, pairAddress, token0, token1);
  // create the tracked contract based on the template
  Pool.create(pairAddress);
}
