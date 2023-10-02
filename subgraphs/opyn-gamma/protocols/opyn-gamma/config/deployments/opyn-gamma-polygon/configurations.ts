import { Configurations } from "../../../../../configurations/configurations/interface";
import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/common/constants";

export class OpynPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOracleAddress(blockNumber: i32): Address {
    return Address.fromString("0x3d561c832706e6e0b485a7a78958982e782e8e91");
  }
  getControllerAddress(): Address {
    return Address.fromString("0x7a23c712bddde52b22d8ff52e4cdadb1bcb0b203");
  }
  getMarginPoolAddress(): Address {
    return Address.fromString("0x30ae5debc9edf60a23cd19494492b1ef37afa56d");
  }
}
