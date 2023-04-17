import { Network } from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class TheGraphArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getGraphTokenAddress(): string {
    return "0x9623063377ad1b27544c965ccd7342f7ea7e88c7";
  }
  getControllerAddress(): string {
    return "0x0a8491544221dd212964fbb96487467291b2c97e";
  }
}
