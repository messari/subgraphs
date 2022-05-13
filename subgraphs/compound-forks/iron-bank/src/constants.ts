import { Address, dataSource } from "@graphprotocol/graph-ts";
import {
  AVALANCHE_BLOCKS_PER_YEAR,
  ETHEREUM_BLOCKS_PER_YEAR,
  FANTOM_BLOCKS_PER_YEAR,
  Network,
} from "../../src/constants";

let _network: string;
let _comptrollerAddr: Address;
let _unitPerYear: number;

if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
  _network = Network.MAINNET;
  _comptrollerAddr = Address.fromString(
    "0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB"
  );
  _unitPerYear = ETHEREUM_BLOCKS_PER_YEAR;
} else if (equalsIgnoreCase(dataSource.network(), Network.FANTOM)) {
  _network = Network.FANTOM;
  _comptrollerAddr = Address.fromString(
    "0x4250A6D3BD57455d7C6821eECb6206F507576cD2"
  );
  _unitPerYear = FANTOM_BLOCKS_PER_YEAR;
} else if (equalsIgnoreCase(dataSource.network(), Network.AVALANCHE)) {
  _network = Network.AVALANCHE;
  _comptrollerAddr = Address.fromString(
    "0x2eE80614Ccbc5e28654324a66A396458Fa5cD7Cc"
  );
  _unitPerYear = AVALANCHE_BLOCKS_PER_YEAR;
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export let network = _network;
export let comptrollerAddr = _comptrollerAddr;
export let unitPerYear = _unitPerYear as i32;
