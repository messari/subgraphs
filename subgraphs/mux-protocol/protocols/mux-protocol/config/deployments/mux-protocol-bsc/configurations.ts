import { Bytes } from "@graphprotocol/graph-ts";
import { Network } from "../../../../../src/utils/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class MUXProtocolBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getPoolAddress(): Bytes {
    return Bytes.fromHexString("0x855e99f768fad76dd0d3eb7c446c0b759c96d520");
  }
  getMUXLPAddress(): Bytes {
    return Bytes.fromHexString("0x07145ad7C7351c6fe86b6b841fc9bed74eb475a7");
  }
}
