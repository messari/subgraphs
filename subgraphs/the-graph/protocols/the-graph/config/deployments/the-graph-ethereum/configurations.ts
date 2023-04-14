import { Network } from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class TheGraphEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
}
