import { ethereum } from "@graphprotocol/graph-ts";
import { Block } from "../generated/schema";
import { BIGDECIMAL_ZERO } from "./constants";

export function handleBlock(block: ethereum.Block): void {
  let blockEntity = new Block(block.hash.toHexString());

  blockEntity.blockNumber = block.number;
  blockEntity.timestamp = block.timestamp;
  blockEntity.price = BIGDECIMAL_ZERO; // TODO add pricing logic
  blockEntity.save();
}
