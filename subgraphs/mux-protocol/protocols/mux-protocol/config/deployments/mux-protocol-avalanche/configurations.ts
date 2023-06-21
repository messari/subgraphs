import { Bytes } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class MUXProtocolAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getPoolAddress(): Bytes {
    return Bytes.fromHexString("0x0ba2e492e8427fad51692EE8958eBf936bee1d84");
  }
  getMUXLPAddress(): Bytes {
    return Bytes.fromHexString("0xaf2d365e668baafedcfd256c0fbbe519e594e390");
  }
}
