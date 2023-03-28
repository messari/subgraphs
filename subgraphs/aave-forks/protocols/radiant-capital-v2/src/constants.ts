import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export class RewardConfig {
  public readonly rewardTokenAddress: string;
  public readonly poolAddress: string; // used for pricing the token
  public readonly rTokenMarket: string; // used to price the other token in the market
}

export const ARBITRUM_REWARD_CONFIG = new RewardConfig(
  "0x3082cc23568ea640225c2467653db90e9250aaa0", // RDNT token
  "0xa8ba5f3ccfb8d2b7f4225e371cde11871e088933", // RDNT/WETH pool
  "0x0df5dfd95966753f01cb80e76dc20ea958238c46" // rWETH market
);

export const ARBITRUM_REWARD_TOKEN_ADDRESS =
  "0x3082cc23568ea640225c2467653db90e9250aaa0"; // RDNT token
export const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
export const RDNT_WETH_POOL_ADDRESS =
  "0xa8ba5f3ccfb8d2b7f4225e371cde11871e088933";
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
