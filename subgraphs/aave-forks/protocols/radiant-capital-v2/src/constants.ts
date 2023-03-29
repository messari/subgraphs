import { dataSource, log } from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";
import { equalsIgnoreCase } from "../../../src/constants";

///////////////////////
///// Reward Info /////
///////////////////////

export class RewardConfig {
  constructor(
    public readonly rewardTokenAddress: string,
    public readonly otherPoolTokenAddress: string,
    public readonly poolAddress: string, // used for pricing the token
    public readonly rTokenMarket: string // used to price the other token in the market
  ) {}
}

export const ARBITRUM_REWARD_CONFIG = new RewardConfig(
  "0x3082cc23568ea640225c2467653db90e9250aaa0", // RDNT token
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH token
  "0xa8ba5f3ccfb8d2b7f4225e371cde11871e088933", // RDNT/WETH pool
  "0x0df5dfd95966753f01cb80e76dc20ea958238c46" // rWETH market
);

export const BSC_REWARD_CONFIG = new RewardConfig(
  "0xf7de7e8a6bd59ed41a4b5fe50278b3b7f31384df", // RDNT token
  ZERO_ADDRESS, // NO POOL
  ZERO_ADDRESS, // NO POOL
  ZERO_ADDRESS // NO POOL
);

export function getRewardConfig(): RewardConfig {
  const network = dataSource.network();

  if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return ARBITRUM_REWARD_CONFIG;
  }
  if (equalsIgnoreCase(network, Network.BSC)) {
    return BSC_REWARD_CONFIG;
  }

  log.error("[getRewardConfig] Unsupported network {}", [network]);
  return new RewardConfig(
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS
  );
}

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Radiant Capital V2";
  export const SLUG = "radiant-capital-v2";
}

// Number of decimals in which rToken oracle prices are returned.
export const rTOKEN_DECIMALS = 8;

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: string, // aka, PoolAddressesProviderRegistry
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new NetworkSpecificConstant(
      "0x091d52cace1edc5527c99cdcfa6937c1635330e4",
      Network.ARBITRUM_ONE
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    return new NetworkSpecificConstant(
      "0x63764769da006395515c3f8aff9c91a809ef6607",
      Network.BSC
    );
  } else {
    log.critical("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(ZERO_ADDRESS, "");
  }
}
