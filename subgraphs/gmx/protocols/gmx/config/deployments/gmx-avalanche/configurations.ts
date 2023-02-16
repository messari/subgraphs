import { Bytes } from "@graphprotocol/graph-ts";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class GMXAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getVaultAddress(): Bytes {
    return Bytes.fromHexString("0x9ab2de34a33fb459b538c43f251eb825645e8595");
  }
  getGLPAddress(): Bytes {
    return Bytes.fromHexString("0x01234181085565ed162a948b6a5e88758cd7c7b8");
  }
}
