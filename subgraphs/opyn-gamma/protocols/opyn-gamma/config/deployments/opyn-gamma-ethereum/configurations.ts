import { Configurations } from "../../../../../configurations/configurations/interface";
import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/common/constants";

export class OpynEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getOracleAddress(blockNumber: i32): Address {
    if (blockNumber < 12729956) {
      // V1 oracle
      return Address.fromString("0xc497f40d1b7db6fa5017373f1a0ec6d53126da23");
    }
    return Address.fromString("0x789cd7ab3742e23ce0952f6bc3eb3a73a0e08833");
  }
  getControllerAddress(): Address {
    return Address.fromString("0x4ccc2339f87f6c59c6893e1a678c2266ca58dc72");
  }
  getMarginPoolAddress(): Address {
    return Address.fromString("0x5934807cc0654d46755ebd2848840b616256c6ef");
  }
}
