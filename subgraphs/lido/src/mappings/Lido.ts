import { Address, log } from "@graphprotocol/graph-ts";
import { Submitted, Transfer } from "../../generated/Lido/Lido";
import { NodeOperatorsRegistry } from "../../generated/Lido/NodeOperatorsRegistry";
import { getOrCreateToken } from "../entities/token";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolAndPoolTvl,
  updateSupplySideRevenueMetrics,
  updateProtocolSideRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import {
  PROTOCOL_TREASURY_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  PROTOCOL_ID,
  BIGINT_ZERO,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";
import { Lido } from "../../generated/Lido/Lido";

export function handleSubmit(event: Submitted): void {
  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  const lido = Lido.bind(event.address);
  const supply = lido.totalSupply();
  const pool = getOrCreatePool(event.block.number, event.block.timestamp);
  pool.outputTokenSupply = supply;
  pool.save();

  // update metrics
  updateUsageMetrics(event.block, event.params.sender);
  updateProtocolAndPoolTvl(event.block, event.params.amount);
}

// handleTransfer is used to track minting of new shares.
// From here we calculate protocol side revenue.
export function handleTransfer(event: Transfer): void {
  const sender = event.params.from;
  const recipient = event.params.to;
  const value = event.params.value;
  if (sender.toHexString() != ZERO_ADDRESS) {
    return;
  }

  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  // get node operators
  let nodeOperators: Address[] = [];
  const nodeOperatorsRegistry = NodeOperatorsRegistry.bind(
    Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID)
  );
  const getRewardsDistributionCallResult =
    nodeOperatorsRegistry.try_getRewardsDistribution(BIGINT_ZERO);
  if (getRewardsDistributionCallResult.reverted) {
    log.info("NodeOperatorsRegistry call reverted", []);
  } else {
    nodeOperators = getRewardsDistributionCallResult.value.getRecipients();
  }

  const fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  const isMintToTreasury =
    fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  const isMintToNodeOperators = fromZeros && nodeOperators.includes(recipient);

  // update metrics
  if (isMintToTreasury || isMintToNodeOperators) {
    updateProtocolSideRevenueMetrics(event.block, value);
    updateSupplySideRevenueMetrics(event.block);
    updateProtocolAndPoolTvl(event.block, BIGINT_ZERO);
  }
}
