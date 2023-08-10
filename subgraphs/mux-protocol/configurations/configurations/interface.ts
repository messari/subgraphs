import { Bytes } from "@graphprotocol/graph-ts";

// This interface is to be used by the configurations classes for each protocol/network deployment.
// If a new configuration is needed for a deployment, add a new value to the configurations interface.
export interface Configurations {
  getNetwork(): string;
  getPoolAddress(): Bytes;
  getMUXLPAddress(): Bytes;
}
