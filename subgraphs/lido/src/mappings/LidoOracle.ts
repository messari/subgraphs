import { ethereum } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";
import { PostTotalShares } from "../../generated/LidoOracle/LidoOracle";
import { updateTotalRevenueMetrics } from "../financialMetrics";
// import { LidoOracle } from "../../generated/schema";

export function handlePostTotalShares(event: PostTotalShares): void {
    log.info(" -------------> BEGIN UpdateTotalRevenueMetrics {}", [""]);
    updateTotalRevenueMetrics(event.block, event.params.postTotalPooledEther, event.params.preTotalPooledEther, event.params.totalShares);
    log.info(" -------------> END UpdateTotalRevenueMetrics {}", [""]);
}