import { Address } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolId(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getAgChainlinkDataFeed(): Address;
  getAuChainlinkDataFeed(): Address;
}
