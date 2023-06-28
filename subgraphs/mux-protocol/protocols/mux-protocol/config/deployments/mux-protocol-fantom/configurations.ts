import { Bytes } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class MUXProtocolFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getPoolAddress(): Bytes {
    return Bytes.fromHexString("0x2e81f443a11a943196c88afcb5a0d807721a88e6");
  }
  getMUXLPAddress(): Bytes {
    return Bytes.fromHexString("0xddade9a8da4851960dfcff1ae4a18ee75c39edd2");
  }
}
