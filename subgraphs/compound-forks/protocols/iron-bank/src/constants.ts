import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import {
  AVALANCHE_BLOCKS_PER_YEAR,
  ETHEREUM_BLOCKS_PER_YEAR,
  FANTOM_BLOCKS_PER_YEAR,
  Network,
} from "../../../src/constants";

export class NetworkSpecificConstant {
  comptrollerAddr: Address;
  network: string;
  unitPerYear: i32;
  constructor(comptrollerAddr: Address, network: string, unitPerYear: i32) {
    this.comptrollerAddr = comptrollerAddr;
    this.network = network;
    this.unitPerYear = unitPerYear;
  }
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  let network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB"),
      Network.MAINNET,
      ETHEREUM_BLOCKS_PER_YEAR
    );
  } else if (equalsIgnoreCase(network, Network.FANTOM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x4250A6D3BD57455d7C6821eECb6206F507576cD2"),
      Network.FANTOM,
      FANTOM_BLOCKS_PER_YEAR
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x2eE80614Ccbc5e28654324a66A396458Fa5cD7Cc"),
      Network.AVALANCHE,
      AVALANCHE_BLOCKS_PER_YEAR
    );
  } else {
    log.error("[getNetworkSpecificConstant] Unsupported network {}", [network]);
    return new NetworkSpecificConstant(
      Address.fromString("0x0000000000000000000000000000000000000000"),
      "",
      0
    );
  }
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() == b.toLowerCase();
}
