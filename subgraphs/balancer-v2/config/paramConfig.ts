import { dataSource, BigDecimal, log } from "@graphprotocol/graph-ts";

let UNTRACKED_POOLS_TEMP: string[];

if (dataSource.network() == "mainnet") {
  UNTRACKED_POOLS_TEMP = ["0x5a172919fff040196b36b238b9e2e7e6d33f616a", "0xC065798F227b49C150bCDC6CDc43149A12c4d757"];
}

export namespace NetworkConfigs {
  export const UNTRACKED_POOLS = UNTRACKED_POOLS_TEMP;
}
