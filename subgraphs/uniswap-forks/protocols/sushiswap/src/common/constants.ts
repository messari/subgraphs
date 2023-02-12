import { BigInt } from "@graphprotocol/graph-ts";

////////////////////
//////Versions//////
////////////////////
import { Versions } from "../../../../src/versions";

export const PROTOCOL_SUBGRAPH_VERSION = Versions.getSubgraphVersion();
export const PROTOCOL_METHODOLOGY_VERSION = Versions.getMethodologyVersion();
export const PROTOCOL_NAME = "SushiSwap";
export const PROTOCOL_SLUG = "sushiswap";

export const MASTERCHEFV2_SUSHI_PER_BLOCK =
  BigInt.fromI64(20000000000000000000);
