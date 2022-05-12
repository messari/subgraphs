// rari fuse v1 constants
import {
  LendingType,
  Network,
  ProtocolType,
  RiskType,
} from "../../src/constants";

////////////////////////////
//// Ethereum Addresses ////
////////////////////////////

// TODO: move some to overall constants
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";

export const FACTORY_CONTRACT = "0x835482FE0532f169024d5E9410199369aAD5C77E"; // FusePoolDirectory.sol

///////////////////////////
//// Protocol Specific ////
///////////////////////////

export const NETWORK_ETHEREUM = Network.MAINNET;
export const PROTOCOL_NAME = "Fuse v1";
export const PROTOCOL_SLUG = "fuse-v2";
export const SUBGRAPH_VERSION = "0.0.5";
export const SCHEMA_VERSION = "1.2.1";
export const METHODOLOGY_VERSION = "1.0.0";
