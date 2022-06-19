import { dataSource, BigDecimal, log } from "@graphprotocol/graph-ts";


let UNTRACKEDPOOLSTEMP:string[]

if (dataSource.network() == "mainnet") {
  UNTRACKEDPOOLSTEMP=["0x5a172919fff040196b36b238b9e2e7e6d33f616a"
                    ,"0xC065798F227b49C150bCDC6CDc43149A12c4d757"]
}

 

export namespace NetworkConfigs {
  export const UNTRACKEDPOOLS = UNTRACKEDPOOLSTEMP;
}
