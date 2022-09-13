import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import {
  ARBITRUM_BLOCKS_PER_YEAR,
  BSC_BLOCKS_PER_YEAR,
  cTokenDecimals,
  ETHEREUM_BLOCKS_PER_YEAR,
  MATIC_BLOCKS_PER_YEAR,
  Network,
} from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export class NetworkSpecificConstant {
  comptrollerAddr: Address;
  network: string;
  unitPerYear: i32;
  nativeToken: TokenData | null;
  nativeCToken: TokenData | null;
  constructor(
    comptrollerAddr: Address,
    network: string,
    unitPerYear: i32,
    nativeToken: TokenData | null,
    nativeCToken: TokenData | null
  ) {
    this.comptrollerAddr = comptrollerAddr;
    this.network = network;
    this.unitPerYear = unitPerYear;
    this.nativeToken = nativeToken;
    this.nativeCToken = nativeCToken;
  }
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  let network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258"),
      Network.MAINNET,
      ETHEREUM_BLOCKS_PER_YEAR,
      new TokenData(
        Address.fromString("0x0000000000000000000000000000000000000000"),
        "Ether",
        "ETH",
        18
      ),
      new TokenData(
        Address.fromString("0xD06527D5e56A3495252A528C4987003b712860eE"),
        "Cream Ether",
        "crETH",
        cTokenDecimals
      )
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x589de0f0ccf905477646599bb3e5c622c84cc0ba"),
      Network.BSC,
      BSC_BLOCKS_PER_YEAR,
      new TokenData(
        Address.fromString("0x0000000000000000000000000000000000000000"),
        "BNB",
        "BNB",
        18
      ),
      new TokenData(
        Address.fromString("0x1ffe17b99b439be0afc831239ddecda2a790ff3a"),
        "Cream BNB",
        "crBNB",
        cTokenDecimals
      )
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x20CA53E2395FA571798623F1cFBD11Fe2C114c24"),
      Network.MATIC,
      MATIC_BLOCKS_PER_YEAR,
      null,
      null
    );
  } else if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xbadaC56c9aca307079e8B8FC699987AAc89813ee"),
      Network.ARBITRUM_ONE,
      ARBITRUM_BLOCKS_PER_YEAR,
      null,
      null
    );
  } else {
    log.error("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(
      Address.fromString("0x0000000000000000000000000000000000000000"),
      "",
      0,
      null,
      null
    );
  }
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
