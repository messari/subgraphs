import { ethereum } from "@graphprotocol/graph-ts";
import { Network } from "../generated/schema";
import { NETWORK, SCHEMA_VERSION, SUBGRAPH_VERSION } from "./constants";

export function handleBlock(block: ethereum.Block): void {
  let network = getOrCreateNetwork();
  network.currentBlock = block.number;

  network.save();
}

function getOrCreateNetwork(): Network {
  let network = Network.load(NETWORK);

  if (!network) {
    network = new Network(NETWORK);
    network.subgraphVersion = SUBGRAPH_VERSION;
    network.schemaVersion = SCHEMA_VERSION;
    network.save();
  }

  return network;
}
