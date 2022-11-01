import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0x0c4681e6c0235179ec3d4f4fc4df3d14fdd96017"; // RDNT token
export const RDNT_WETH_Uniswap_Pair =
  "0x24704aff49645d32655a76df6d407e02d146dafc"; // RDNT/WETH
export const RWETH_ADDRESS = "0x15b53d277af860f51c3e6843f8075007026bbb3a";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Radiant Capital";
  export const SLUG = "radiant-capital";
  export const SCHEMA_VERSION = "2.0.1";
  export const SUBGRAPH_VERSION = "1.0.2";
  export const METHODOLOGY_VERSION = "1.0.0";
  export const PROTOCOL_ADDRESS = "0xe21b295ed46528efd5f3ef66e18bc6ad1c87f003"; // addresses provider
  export const NETWORK = Network.ARBITRUM_ONE;
}

// Number of decimals in which rToken oracle prices are returned.
export const rTOKEN_DECIMALS = 8;
