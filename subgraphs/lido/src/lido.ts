import { Submitted } from "../generated/Lido/Lido";
import { LidoSubmission } from "../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getTokenOrCreate } from "./token";
import { PROTOCOL_CONTRACT } from "./utils/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "./usageMetrics";
import { updateFinancialMetrics } from "./financialMetrics";

export function handleSubmit(event: Submitted): void {
    // TODO: move to right place
    log.info("==========> BEGIN: {}", [""]);

    // getOrCreateProtocol();
    // log.info("==========> getOrCreateProtocolComplete: {}", [""]);

    getTokenOrCreate(Address.fromString(PROTOCOL_CONTRACT), event.block);
    log.info("==========> getTokenOrCreateComplete: {}", [""]);

    updateUsageMetrics(event.block, event.params.sender);
    log.info("==========> updateUsageMetricsComplete: {}", [""]);

    updateFinancialMetrics(event.block, event.params.amount);
    log.info("==========> updateFinancialsSnapshot: {}", [""]);

    let entity = new LidoSubmission(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    )
  
    entity.sender = event.params.sender;
    entity.amount = event.params.amount;
    entity.referral = event.params.referral;

    entity.save();
  }