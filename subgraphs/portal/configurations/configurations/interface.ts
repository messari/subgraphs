import { Address, BigInt } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getNetworkID(): BigInt;
  getFactoryAddress(): Address;
  getBridgeAddress(): Address;
}
