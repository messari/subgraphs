import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals, Network } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export class NetworkSpecificConstant {
  constructor(
    public readonly comptrollerAddress: Address,
    public readonly network: string,
    public readonly nativeToken: TokenData,
    public readonly nativeCToken: TokenData
  ) {}
}

export function getProtocolData(): NetworkSpecificConstant {
  return new NetworkSpecificConstant(
    Address.fromString("0xf3caf0be62a0e6ff6569004af55f57a0b9440434"),
    Network.ZKSYNC_ERA,
    zkSyncToken,
    zkSyncNativeCToken
  );
}

//
//
// TokenData classes

// zkSync does not have a native token
const zkSyncToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "NA",
  "NA",
  18
);

const zkSyncNativeCToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000001"),
  "Reactor Fusion NA",
  "rfNA",
  cTokenDecimals
);
