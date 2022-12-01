import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";

export class AuraFinanceMainnetConfigurations implements Configurations {
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
    return "0x7818A1DA7BD1E64c199029E86Ba244a9798eEE10";
  }
  getRewardToken(): string {
    return "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF";
  }
}
