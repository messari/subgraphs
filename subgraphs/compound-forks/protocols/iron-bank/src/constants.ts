import { Address, dataSource, log, BigInt } from "@graphprotocol/graph-ts";
import {
  ETHEREUM_BLOCKS_PER_YEAR,
  Network,
  SECONDS_PER_YEAR,
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
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"),
      Network.MAINNET,
      ETHEREUM_BLOCKS_PER_YEAR
    );
  } else if (equalsIgnoreCase(network, Network.FANTOM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x4250a6d3bd57455d7c6821eecb6206f507576cd2"),
      Network.FANTOM,
      // Iron bank on fantom actually calculates interest based on timestamp
      // See https://github.com/messari/subgraphs/issues/1746 for details
      SECONDS_PER_YEAR
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x2ee80614ccbc5e28654324a66a396458fa5cd7cc"),
      Network.AVALANCHE,
      // Iron bank on avalance actually calculates interest based on timestamp
      // See https://github.com/messari/subgraphs/issues/1746 for details
      SECONDS_PER_YEAR
    );
  } else if (equalsIgnoreCase(network, Network.OPTIMISM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xe0b57feed45e7d908f2d0dacd26f113cf26715bf"),
      Network.OPTIMISM,
      // Iron bank on optimism actually calculates interest based on timestamp
      // See https://github.com/messari/subgraphs/issues/1746 for details
      SECONDS_PER_YEAR
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
  "0x785f08fb77ec934c01736e30546f87b4daccbe50";
export const rETH_OP_USD_POOL_ADDRESS =
  "0xb0de49429fbb80c635432bbad0b3965b28560177";
export const IB_TOKEN_ADDRESS = "0x00a35fd824c717879bf370e70ac6868b95870dfb";
export const rETH_ADDRESS = "0x9bcef72be871e61ed4fbbc7630889bee758eb81d";
export const BB_aUSD_ADDRESS = "0x6222ae1d2a9f6894da50aa25cb7b303497f9bebd";
