import { Submitted, Transfer } from "../../generated/Lido/Lido";
import { NodeOperatorsRegistry } from "../../generated/Lido/NodeOperatorsRegistry";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolSideRevenueMetrics,
  updatePoolSnapshotsTvl,
  updateProtocolAndPoolTvl,
} from "../entityUpdates/financialMetrics";
import {
  PROTOCOL_TREASURY_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  PROTOCOL_ID,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
} from "../utils/constants";
import { getOrCreateToken } from "../entities/token";

export function handleSubmit(event: Submitted): void {
  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  updateUsageMetrics(event.block, event.params.sender);
  updateProtocolAndPoolTvl(event.block, event.params.amount);
}

export function handleTransfer(event: Transfer): void {
  let sender = event.params.from;
  let recipient = event.params.to;
  let value = event.params.value;

  let nodeOperators: Address[] = [];
  let nodeOperatorsRegistry = NodeOperatorsRegistry.bind(
    Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID)
  );
  let callResult = nodeOperatorsRegistry.try_getRewardsDistribution(
    BIGINT_ZERO
  );
  if (callResult.reverted) {
    log.info("NodeOperatorsRegistry call reverted", []);
  } else {
    nodeOperators = callResult.value.getRecipients();
  }

  let fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  let isMintToTreasury =
    fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  let isMintToNodeOperators = fromZeros && nodeOperators.includes(recipient);

  if (isMintToTreasury || isMintToNodeOperators) {
    updatePoolSnapshotsTvl(event.block);
    updateProtocolSideRevenueMetrics(event.block, value);
  }
}
