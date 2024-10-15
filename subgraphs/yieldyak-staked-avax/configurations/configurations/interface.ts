import { Address } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolId(): string;
  getProtocolIdBI(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getLSTAddress(): Address;
  getWAVAXAddress(): Address;
}
