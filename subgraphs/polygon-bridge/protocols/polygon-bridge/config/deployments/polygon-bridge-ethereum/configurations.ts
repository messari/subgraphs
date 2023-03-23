import { Address } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PolygonMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77";
  }
  getRewardToken(): string {
    return "";
  }
  ignoreToken(tokenAddr: string): boolean {
    const ignoreList = ["0x5D0fa08AEb173AdE44B0Cf7F31d506D8E04f0ac8"];
    // if (ignoreList.indexOf(tokenAddr) > -1) {
    //   return true;
    // }

    return false;
  }
}
