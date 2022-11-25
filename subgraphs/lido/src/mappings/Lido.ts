import { Address, log } from "@graphprotocol/graph-ts";
import { Lido, Submitted, Transfer } from "../../generated/Lido/Lido";
import { LidoOracle } from "../../generated/Lido/LidoOracle";
import { NodeOperatorsRegistry } from "../../generated/Lido/NodeOperatorsRegistry";
import { getOrCreateToken } from "../entities/token";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolAndPoolTvl,
  updateSupplySideRevenueMetrics,
  updateProtocolSideRevenueMetrics,
  updateTotalRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import {
  PROTOCOL_TREASURY_ID,
  PROTOCOL_ORACLE_ID,
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  PROTOCOL_ID,
  BIGINT_ZERO,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";

export function handleSubmit(event: Submitted): void {
  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  // update metrics
  updateUsageMetrics(event.block, event.params.sender);
  updateProtocolAndPoolTvl(event.block, event.params.amount);
}

export function handleTransfer(event: Transfer): void {
  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  // get pre and post pooled ether
  let preTotalPooledEther = BIGINT_ZERO;
  let postTotalPooledEther = BIGINT_ZERO;
  const lidoOracle = LidoOracle.bind(Address.fromString(PROTOCOL_ORACLE_ID));
  const lastCompletedReportDeltaCallResult = lidoOracle.try_getLastCompletedReportDelta();

  if (lastCompletedReportDeltaCallResult.reverted) {
    log.info("LidoOracle call reverted", []);
  } else {
    preTotalPooledEther = lastCompletedReportDeltaCallResult.value.getPreTotalPooledEther();
    postTotalPooledEther = lastCompletedReportDeltaCallResult.value.getPostTotalPooledEther();
  }

  // get total shares
  let totalShares = BIGINT_ZERO;
  const lido = Lido.bind(Address.fromString(PROTOCOL_ID));
  const getTotalSharesCallResult = lido.try_getTotalShares();

  if (getTotalSharesCallResult.reverted) {
    log.info("Lido call reverted", []);
  } else {
    totalShares = getTotalSharesCallResult.value;
  }
  const pool = getOrCreatePool(event.block.number, event.block.timestamp);
  pool.outputTokenSupply = totalShares;
  pool.save();

  // get node operators
  const sender = event.params.from;
  const recipient = event.params.to;
  const value = event.params.value;

  let nodeOperators: Address[] = [];
  const nodeOperatorsRegistry = NodeOperatorsRegistry.bind(
    Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID)
  );
  const getRewardsDistributionCallResult = nodeOperatorsRegistry.try_getRewardsDistribution(BIGINT_ZERO);
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
  let protocolRevenue = BIGINT_ZERO;
  if (isMintToTreasury || isMintToNodeOperators) {
    protocolRevenue = value;

    if (pool.outputTokenSupply < totalShares) {
      // only increase total revenue if this is a mint to protocol (implies a distribution)
      // and if we haven't accounted for it yet (shares updated).
      const totalRevenue = postTotalPooledEther.minus(preTotalPooledEther);
      updateTotalRevenueMetrics(event.block, totalRevenue, totalShares);
    }
  }

  updateProtocolSideRevenueMetrics(event.block, protocolRevenue);
  updateSupplySideRevenueMetrics(event.block); // last, since it is calculated from total&protocol
  updateProtocolAndPoolTvl(event.block, BIGINT_ZERO);
}
