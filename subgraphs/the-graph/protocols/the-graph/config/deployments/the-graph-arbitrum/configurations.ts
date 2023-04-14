import { Network } from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class TheGraphArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
}
