import { Address } from "@graphprotocol/graph-ts";

// This interface is to be used by the configurations classes for each protocol/network deployment.
// If a new configuration is needed for a deployment, add a new value to the configurations interface.
export interface Configurations {
  getNetwork(): string;
  getOracleAddress(blockNumber: i32): Address;
  getControllerAddress(): Address;
  getMarginPoolAddress(): Address;
}
