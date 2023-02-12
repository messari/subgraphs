import { BigInt } from "@graphprotocol/graph-ts";

////////////////////
//////Versions//////
////////////////////
import { Versions } from "../../../../src/versions";

export const PROTOCOL_SUBGRAPH_VERSION = Versions.getSubgraphVersion();
export const PROTOCOL_METHODOLOGY_VERSION = Versions.getMethodologyVersion();
export const PROTOCOL_NAME = "Trader Joe";
export const PROTOCOL_SLUG = "trader-joe";

export const TRADER_JOE_AVALANCHE_REWARD_TOKEN_RATE = BigInt.fromString(
  "30000000000000000000"
);
