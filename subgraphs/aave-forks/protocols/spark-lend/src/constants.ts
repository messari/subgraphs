import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Spark Lend";
  export const NAME = "Spark Lend";
  export const SLUG = "spark-lend";
}

export namespace IavsTokenType {
  export const ATOKEN = "ATOKEN";
  export const INPUTTOKEN = "INPUTTOKEN";
  export const VTOKEN = "VTOKEN";
  export const STOKEN = "STOKEN";
}

export const AAVE_DECIMALS = 8;

export namespace InterestRateMode {
  export const NONE = 0 as i32;
  export const STABLE = 1 as i32;
  export const VARIABLE = 2 as i32;
}

////////////////////////////
///// Network Specific /////
////////////////////////////

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, PoolAddressesProviderRegistry
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x03cfa0c4622ff84e50e75062683f44c9587e6cc1"),
      Network.MAINNET
    );
  } else {
    log.critical("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(Address.fromString(ZERO_ADDRESS), "");
  }
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
