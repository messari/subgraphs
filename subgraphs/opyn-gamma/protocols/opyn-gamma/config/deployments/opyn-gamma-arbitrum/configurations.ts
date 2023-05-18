import { Configurations } from "../../../../../configurations/configurations/interface";
import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/common/constants";

export class OpynArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOracleAddress(blockNumber: i32): Address {
    return Address.fromString("0x7a1e6f0f07ee2ddde14cd4b8eb582bad065357c5");
  }
  getControllerAddress(): Address {
    return Address.fromString("0xee30f92cc9bf896679567d1acd551f0e179756fc");
  }
  getMarginPoolAddress(): Address {
    return Address.fromString("0x63d8d20606c048b9b79a30ea45ca6787f8aeb051");
  }
}
