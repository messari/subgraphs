import { Bytes } from "@graphprotocol/graph-ts";

import { Network } from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/common/constants";
import { stringToBytesList } from "../../../../../src/common/utils";

export class PancakeV3BSCConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865");
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getBrokenERC20Tokens(): Bytes[] {
    return stringToBytesList([]);
  }
}
