import { Configurations } from "../../../../../configurations/configurations/interface";
import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/common/constants";

export class OpynAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOracleAddress(blockNumber: i32): Address {
    return Address.fromString("0x108abfba5ad61bd61a930bfe73394558d60f0b10");
  }
  getControllerAddress(): Address {
    return Address.fromString("0x9e3b94819aaf6de606c4aa844e3215725b997064");
  }
  getMarginPoolAddress(): Address {
    return Address.fromString("0xccf6629aeab734e621cc59ebb0297196774fdb9d");
  }
}
