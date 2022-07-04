// List of All Tasks
// [X] Pricing conversions for all schema variables
// [ ] Code-reorganzation - pool first vs protoccol frst
// [ ] coed-reorg - getOrCreate together or entities together
// [ ] Verify if buggy - TVL - staking rewards
// [ ] Code stylessstandards - prettier, lines, etc
// [ ] CI/CD?
// [ ] Validatioon
// [ ] PROTOCOL_ID param/arg for pool, protocol
// [ ] Gather protocol, token, pool metdata ddynamically where appropriate
// [ ] block.number, block.timestamp missing
// [ ] Token lastPriceUSD and lastPriceBlockNumber
// [ ] RewardTokenType, RewardToken should be null (possbile with enum?), null


import { Submitted, Transfer } from "../../generated/Lido/Lido";
import { 
  PROTOCOL_TREASURY_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS
} from "../utils/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "../usageMetrics";
import { 
  updateTotalValueLockedUSD,
  updateProtocolAndSupplySideRevenueMetrics,
} from "../financialMetrics";

export function handleSubmit(event: Submitted): void {
    // TODO: move to right place
    log.info("==========> BEGIN: {}", [""]);

    updateUsageMetrics(event.block, event.params.sender);
    log.info("==========> updateUsageMetricsComplete: {}", [""]);

    updateTotalValueLockedUSD(event.block, event.params.amount);
    log.info("==========> updateTotalValueLockedUSD: {}", [""]);
}

export function handleTransfer(event: Transfer): void {
  let sender = event.params.from;
  let recipient = event.params.to;
  let value = event.params.value;
  log.info("~~~~~~~~~~~~> BEGIN: sender: {} recipient: {} value: {}", [sender.toHexString(), recipient.toHexString(), value.toString()]);

  let fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  let isMintToTreasury = fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  let isMintToNodeOperatorsRegistry = fromZeros && recipient == Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID);

  if (isMintToTreasury || isMintToNodeOperatorsRegistry) {
    updateProtocolAndSupplySideRevenueMetrics(event.block, value);
  }

  log.info("~~~~~~~~~~~~> END: {}", [""]);
}
