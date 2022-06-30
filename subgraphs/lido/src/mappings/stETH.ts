// import { log } from "@graphprotocol/graph-ts";
// import { TransferShares } from "../../generated/stETH/stEth";
// import { updateProtcolSideRevenueMetrics } from "../financialMetrics";
// import { StEth } from "../../generated/schema";

// export function handleTransferShares(event: TransferShares): void {
//     log.info(" -------------> BEGIN TransfefrShares {}", [""]);
//     updateProtcolSideRevenueMetrics(event.block, event.params.to, event.params.sharesValue);
//     log.info(" -------------> END TransferShares {}", [""]);

//     let entity = new StEth(
//       event.transaction.hash.toHex() + '-' + event.logIndex.toString()
//     )
  
//     entity.from = event.params.from;
//     entity.to = event.params.to;
//     entity.sharesValue = event.params.sharesValue;

//     entity.save();
// }