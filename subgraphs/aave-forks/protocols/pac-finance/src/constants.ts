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
  export const PROTOCOL = "Pac Finance";
  export const NAME = "Pac Finance";
  export const SLUG = "pac-finance";
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
  if (equalsIgnoreCase(network, Network.BLAST_MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xdb3ceaa3ff702242b9aaae63e4ba673ef7a2517d"),
      Network.BLAST_MAINNET
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
