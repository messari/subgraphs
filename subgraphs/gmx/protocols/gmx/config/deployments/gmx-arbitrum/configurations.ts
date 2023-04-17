import { Bytes } from "@graphprotocol/graph-ts";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class GMXArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getVaultAddress(): Bytes {
    return Bytes.fromHexString("0x489ee077994b6658eafa855c308275ead8097c4a");
  }
  getGLPAddress(): Bytes {
    return Bytes.fromHexString("0x4277f8f2c384827b5273592ff7cebd9f2c1ac258");
  }
}
