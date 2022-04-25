import { ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, Swap } from "../../generated/schema";
import { getOrCreateProtocol } from "../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constant";

export function getOrCreateSwap(event: ethereum.Event, pool: LiquidityPool): Swap {
  let swap_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
  let protocol = getOrCreateProtocol();
  let swap = Swap.load(swap_id);
  if (swap == null) {
    swap = new Swap(swap_id);
    swap.hash = event.transaction.hash.toString();
    swap.protocol = protocol.id;
    swap.logIndex = event.logIndex.toI32();
    swap.from = ZERO_ADDRESS;
    swap.to = ZERO_ADDRESS;
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.tokenIn = ZERO_ADDRESS;
    swap.amountIn = BIGINT_ZERO;
    swap.amountInUSD = BIGDECIMAL_ZERO;
    swap.tokenOut = ZERO_ADDRESS;
    swap.amountOut = BIGINT_ZERO;
    swap.amountOutUSD = BIGDECIMAL_ZERO;
    swap.pool = pool.id;
    swap.save();

    return swap as Swap;
  }
  return swap as Swap;
}
