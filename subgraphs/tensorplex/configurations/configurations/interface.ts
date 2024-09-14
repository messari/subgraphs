import { Address } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolId(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getTaoAddress(): Address;
  // getEthAddress(): Address;
  // getPairAddress(): Address;
  getLSTAddress(): Address;
  getChainlinkDataFeed(): Address;
}
