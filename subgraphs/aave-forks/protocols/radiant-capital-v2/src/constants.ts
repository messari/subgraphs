import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0x3082cc23568ea640225c2467653db90e9250aaa0"; // RDNT token
export const RDNT_WETH_Uniswap_Pair =
  "0x24704aff49645d32655a76df6d407e02d146dafc"; // RDNT/WETH TODO
export const RWETH_ADDRESS = "0x0df5dfd95966753f01cb80e76dc20ea958238c46";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Radiant Capital V2";
  export const SLUG = "radiant-capital-v2";
  export const PROTOCOL_ADDRESS = "0x091d52cace1edc5527c99cdcfa6937c1635330e4"; // addresses provider
  export const NETWORK = Network.ARBITRUM_ONE;
}

// Number of decimals in which rToken oracle prices are returned.
export const rTOKEN_DECIMALS = 8;
