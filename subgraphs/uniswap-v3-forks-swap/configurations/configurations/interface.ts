import { Bytes } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): Bytes;
  getUntrackedPairs(): Bytes[];
  getBrokenERC20Tokens(): Bytes[];
}
