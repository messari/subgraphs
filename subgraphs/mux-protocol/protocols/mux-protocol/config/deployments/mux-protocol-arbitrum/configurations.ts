import { Bytes } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class MUXProtocolArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getPoolAddress(): Bytes {
    return Bytes.fromHexString("0x3e0199792ce69dc29a0a36146bfa68bd7c8d6633");
  }
  getMUXLPAddress(): Bytes {
    return Bytes.fromHexString("0x7cbaf5a14d953ff896e5b3312031515c858737c8");
  }
}
