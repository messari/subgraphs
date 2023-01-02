import { Address, dataSource, log, BigInt } from "@graphprotocol/graph-ts";
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

const OPTIMISM_BLOCKS_PER_YEAR = ETHEREUM_BLOCKS_PER_YEAR;

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
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
  } else if (equalsIgnoreCase(network, Network.OPTIMISM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xE0B57FEEd45e7D908f2d0DaCd26F113Cf26715BF"),
      Network.OPTIMISM,
      OPTIMISM_BLOCKS_PER_YEAR
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

// contract addresses on optimism for reward emission USD calculation
export const BEETHOVEN_POOL_DEPLOYED_BLOCK = BigInt.fromI32(25922732);
export const rETH_IB_POOL_ADDRESS =
  "0x785F08fB77ec934c01736E30546f87B4daccBe50";
export const rETH_OP_USD_POOL_ADDRESS =
  "0xb0de49429fbb80c635432bbad0b3965b28560177";
export const IB_TOKEN_ADDRESS = "0x00a35FD824c717879BF370E70AC6868b95870Dfb";
export const rETH_ADDRESS = "0x9Bcef72be871e61ED4fBbc7630889beE758eb81D";
export const BB_aUSD_ADDRESS = "0x6222ae1d2a9f6894dA50aA25Cb7b303497f9BEbd";
