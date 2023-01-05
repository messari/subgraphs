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
    return "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234";
  }
  getRewardToken(): string {
    return "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF";
  }
}
