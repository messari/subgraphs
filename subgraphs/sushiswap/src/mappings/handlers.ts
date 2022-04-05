import { PairCreated } from "../../generated/SushiV2Factory/Factory";
import { Transfer, Sync, Mint, Burn } from "../../generated/templates/SushiV2Pair/Pair";
import { getOrCreateToken, getOrCreateDexAmm } from "../common/getters";
import { createLiquidityPool } from "./helpers";

export function handlePairCreated(event: PairCreated): void {
  let protocol = getOrCreateDexAmm();
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);
  let tokenLP = getOrCreateToken(event.params.pair);
  createLiquidityPool(event, protocol, event.params.pair, token0, token1, tokenLP);
}

export function handleTransfer(event: Transfer): void {
  // TODO
}

export function handleSync(event: Sync): void {
  // TODO
}

export function handleMint(event: Mint): void {
  // TODO
}

export function handleBurn(event: Burn): void {
  // TODO
}
