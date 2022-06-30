import { ethereum } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";
import { PostTotalShares } from "../../generated/LidoOracle/LidoOracle";
import { updateTotalRevenueMetrics } from "../financialMetrics";
// import { LidoOracle } from "../../generated/schema";

export function handlePostTotalShares(event: PostTotalShares): void {
    log.info(" -------------> BEGIN UpdateTotalRevenueMetrics {}", [""]);
    updateTotalRevenueMetrics(event.block, event.params.postTotalPooledEther, event.params.preTotalPooledEther);
    log.info(" -------------> END UpdateTotalRevenueMetrics {}", [""]);

    // let entity = new LidoOracle(
    //   event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    // )
  
    // entity.postTotalPooledEther = event.params.postTotalPooledEther;
    // entity.preTotalPooledEther = event.params.preTotalPooledEther;
    // entity.totalShares = event.params.totalShares;

    // entity.save();
}