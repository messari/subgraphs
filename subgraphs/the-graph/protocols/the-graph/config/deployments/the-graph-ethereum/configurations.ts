import { Network } from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class TheGraphEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getGraphTokenAddress(): string {
    return "0xc944e90c64b2c07662a292be6244bdf05cda44a7";
  }
  getControllerAddress(): string {
    return "0x24ccd4d3ac8529ff08c58f74ff6755036e616117";
  }
}
