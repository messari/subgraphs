import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  DexAmmProtocol,
  LiquidityPool,
  Swap,
  Token,
} from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../utils/constant";

export function createSwap(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol,
  tokenIn: Token,
  amountIn: BigInt,
  amountInUSD: BigDecimal,
  tokenOut: Token,
  amountOut: BigInt,
  amountOutUSD: BigDecimal,
  buyer: Address
): void {
  let swap_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
  let swap = Swap.load(swap_id);
  if (swap == null) {
    swap = new Swap(swap_id);
    swap.hash = event.transaction.hash.toString();
    swap.protocol = protocol.id;
    swap.logIndex = event.logIndex.toI32();
    swap.from = event.address.toString();
    swap.to = buyer.toString();
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.tokenIn = tokenIn.id;
    swap.amountIn = amountIn;
    swap.amountInUSD = amountInUSD;
    swap.tokenOut = tokenOut.id;
    swap.amountOut = amountOut;
    swap.amountOutUSD = amountOutUSD;
    swap.pool = pool.id;

    swap.save();
  }
}


