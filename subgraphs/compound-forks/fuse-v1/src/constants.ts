// rari fuse v1 constants
import { Network } from "../../src/constants";

////////////////////////////
//// Ethereum Addresses ////
////////////////////////////

// TODO: move some to overall constants
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";

export const FACTORY_CONTRACT = "0x835482fe0532f169024d5e9410199369aad5c77e"; // FusePoolDirectory.sol
export const ETH_PRICE_ORACLE = "0x1887118e49e0f4a78bd71b792a49de03504a764d";
export const CDAI_ADDRESS = "0x03b6bff9a13adcbff10facc473c6ab2036a2412b"; // cToken address for DAI

///////////////////////////
//// Protocol Specific ////
///////////////////////////

export const NETWORK_ETHEREUM = Network.MAINNET;
export const PROTOCOL_NAME = "Fuse v1";
export const PROTOCOL_SLUG = "fuse-v1";
export const SUBGRAPH_VERSION = "1.0.5";
export const SCHEMA_VERSION = "1.2.1";
export const METHODOLOGY_VERSION = "1.0.0";
