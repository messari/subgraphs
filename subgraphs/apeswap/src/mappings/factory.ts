import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { PairCreated } from "../../generated/Factory/Factory";
import { getOrCreateDex, getOrCreateLPToken, getOrCreateToken } from "../common/getters";
import { updateTokenWhitelists } from "../common/updateMetrics";
import { createLiquidityPool } from "../common/creators";

export function handleNewPair(event: PairCreated): void {
  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event.params.token0.toHexString());
  let token1 = getOrCreateToken(event.params.token1.toHexString());
  let LPtoken = getOrCreateLPToken(event.params.pair.toHexString(), token0, token1);

  updateTokenWhitelists(token0, token1, event.params.pair.toHexString());

  createLiquidityPool(
    event,
    protocol,
    event.params.pair.toHexString(),
    token0,
    token1,
    LPtoken,
  );

  token0.save();
  token1.save();
}
