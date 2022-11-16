import { BigInt } from "@graphprotocol/graph-ts";

// Used in calculations that handle amounts in WEI.
export let ONE_ETHER_IN_WEI = BigInt.fromI32(1000000000).times(
  BigInt.fromI32(1000000000)
);

// Represents the RocketPool protocol ID.
export let ROCKETPOOL_PROTOCOL_ROOT_ID =
  "ROCKETPOOL - DECENTRALIZED ETH2.0 STAKING PROTOCOL";

// Used as a prefix for RPL reward intervals.
export let ROCKETPOOL_RPL_REWARD_INTERVAL_ID_PREFIX =
  "ROCKETPOOL_RPL_REWARD_INTERVAL_ID_";
