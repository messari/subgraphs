import { Bytes } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class MUXProtocolOptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
  }
  getPoolAddress(): Bytes {
    return Bytes.fromHexString("0xc6bd76fa1e9e789345e003b361e4a0037dfb7260");
  }
  getMUXLPAddress(): Bytes {
    return Bytes.fromHexString("0x0509474f102b5cd3f1f09e1e91feb25938ef0f17");
  }
}
