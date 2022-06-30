import { Submitted, Transfer } from "../../generated/Lido/Lido";
import { LidoSubmission } from "../../generated/schema";
import { getTokenOrCreate } from "../token";
import { 
  PROTOCOL_CONTRACT,
  PROTOCOL_TREASURY_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS
} from "../utils/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "../usageMetrics";
import { 
  updateTotalValueLockedUSD,
  updateProtocolSideRevenueMetrics,
} from "../financialMetrics";

export function handleSubmit(event: Submitted): void {
    // TODO: move to right place
    log.info("==========> BEGIN: {}", [""]);

    getTokenOrCreate(Address.fromString(PROTOCOL_CONTRACT), event.block);
    log.info("==========> getTokenOrCreateComplete: {}", [""]);

    updateUsageMetrics(event.block, event.params.sender);
    log.info("==========> updateUsageMetricsComplete: {}", [""]);

    updateTotalValueLockedUSD(event.block, event.params.amount);
    log.info("==========> updateTotalValueLockedUSD: {}", [""]);
    
    let entity = new LidoSubmission(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    );
  
    entity.sender = event.params.sender;
    entity.amount = event.params.amount;
    entity.referral = event.params.referral;

    entity.save();
}

export function handleTransfer(event: Transfer): void {

  // // entity.from = event.params.from
  // // entity.to = event.params.to
  // // entity.value = event.params.value

  // // entity.block = event.block.number
  // // entity.blockTime = event.block.timestamp
  // // entity.transactionHash = event.transaction.hash
  // // entity.transactionIndex = event.transaction.index
  // // entity.logIndex = event.logIndex
  // // entity.transactionLogIndex = event.transactionLogIndex

  let sender = event.params.from;
  let recipient = event.params.to;
  let value = event.params.value;
  log.info("~~~~~~~~~~~~> BEGIN: sender: {} recipient: {} value: {}", [sender.toHexString(), recipient.toHexString(), value.toString()]);

  let fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  let isMintToTreasury = fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  let isMintToNodeOperatorsRegistry = fromZeros && recipient == Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID);

  if (isMintToTreasury || isMintToNodeOperatorsRegistry) {
    updateProtocolSideRevenueMetrics(event.block, recipient, value);
  }

  log.info("~~~~~~~~~~~~> END: {}", [""]);
}