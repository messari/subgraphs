import { PairCreated } from "../../generated/Factory/Factory";
import { _HelperStore } from "../../generated/schema";
import { Pool } from "../../generated/templates";
import { getOrCreateDex, getOrCreateTokenTracker } from "../common/getters";
import { CreateLiquidityPool, UpdateTokenWhitelists } from "../common/helpers";
import { findEthPerToken } from "../common/price";
import { getOrCreatePool } from "../helpers/pool";
import { BIGDECIMAL_ZERO, HELPER_STORE_ID } from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";

export function handleNewPair(event: PairCreated): void {

  let protocol = getOrCreateDex()

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let LPtoken = getOrCreateLPToken(event.params.pair, token0, token1)

  let tokenTracker0 = getOrCreateTokenTracker(event.params.token0)
  let tokenTracker1 = getOrCreateTokenTracker(event.params.token1)

  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  UpdateTokenWhitelists(tokenTracker0, tokenTracker1, event.params.pair)

  CreateLiquidityPool(event, protocol, event.params.pair, token0, token1, LPtoken)

  token0.save()
  token1.save()
}
