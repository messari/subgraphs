import {
  Address,
  ByteArray,
  crypto,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Zero Lend";
  export const NAME = "Zero Lend";
  export const SLUG = "zerolend";
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
      Address.fromString("0x7503a8823b523629e28587317901ba4c055791eb"),
      Network.MAINNET
    );
  } else if (equalsIgnoreCase(network, Network.BLAST_MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xbbaef34d75e15c5d04a078fc2634245842eabdc7"),
      Network.BLAST_MAINNET
    );
  } else if (equalsIgnoreCase(network, Network.ZKSYNC_ERA)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x78b93fbb35c97b32c7381c81fa3a620b3fb7787b"),
      Network.ZKSYNC_ERA
    );
  } else if (equalsIgnoreCase(network, Network.LINEA)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x5046c3c0d7a362709df433d5431d64973c7f08cb"),
      Network.LINEA
    );
  } else if (equalsIgnoreCase(network, Network.XLAYER_MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xbbaef34d75e15c5d04a078fc2634245842eabdc7"),
      Network.XLAYER_MAINNET
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

export const BALANCE_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("BalanceTransfer(address,address,uint256,uint256)")
);
export const BALANCE_TRANSFER_DATA_TYPE = "(uint256,uint256)";
