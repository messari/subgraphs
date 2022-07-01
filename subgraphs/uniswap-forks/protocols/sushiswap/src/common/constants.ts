import { BigInt } from "@graphprotocol/graph-ts";

////////////////////
//////Versions//////
////////////////////

export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";
export const PROTOCOL_NAME = "SushiSwap";
export const PROTOCOL_SLUG = "sushiswap";

export const MASTERCHEFV2_SUSHI_PER_BLOCK =
  BigInt.fromI64(20000000000000000000);

export namespace MasterChef {
  export const MASTERCHEF = "MASTERCHEF";
  export const MASTERCHEFV2 = "MASTERCHEFV2";
  export const MINICHEF = "MINICHEF";
}
