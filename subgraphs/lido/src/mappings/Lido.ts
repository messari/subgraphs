import { Lido, Submitted, Transfer } from "../../generated/Lido/Lido";
import { Address } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "../usageMetrics";
import {
  updateProtocolSideRevenueMetrics,
  updateSupplySideRevenueMetrics,
  updatePoolSnapshotsTvl,
  updateProtocolAndPoolTvl,
} from "../financialMetrics";
import {
  PROTOCOL_TREASURY_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  PROTOCOL_ID,
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

  let fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  let isMintToTreasury =
    fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  // FIX: BUGGGGGG
  let isMintToNodeOperatorsRegistry =
    fromZeros &&
    recipient == Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID);

  if (isMintToTreasury || isMintToNodeOperatorsRegistry) {
    updatePoolSnapshotsTvl(event.block);
    updateProtocolSideRevenueMetrics(event.block, value);
  }
}
