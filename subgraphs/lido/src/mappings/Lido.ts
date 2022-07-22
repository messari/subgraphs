import { Address, log } from "@graphprotocol/graph-ts";
import { Lido, Submitted, Transfer } from "../../generated/Lido/Lido";
import { LidoOracle } from "../../generated/Lido/LidoOracle";
import { NodeOperatorsRegistry } from "../../generated/Lido/NodeOperatorsRegistry";
import { getOrCreateToken } from "../entities/token";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolAndPoolTvl,
  updateSnapshotsTvl,
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
  let lidoOracle = LidoOracle.bind(Address.fromString(PROTOCOL_ORACLE_ID));
  let lastCompletedReportDeltaCallResult = lidoOracle.try_getLastCompletedReportDelta();

  if (lastCompletedReportDeltaCallResult.reverted) {
    log.info("LidoOracle call reverted", []);
  } else {
    preTotalPooledEther = lastCompletedReportDeltaCallResult.value.getPreTotalPooledEther();
    postTotalPooledEther = lastCompletedReportDeltaCallResult.value.getPostTotalPooledEther();
  }

  // get total shares
  let totalShares = BIGINT_ZERO;
  let lido = Lido.bind(Address.fromString(PROTOCOL_ID));
  let getTotalSharesCallResult = lido.try_getTotalShares();

  if (getTotalSharesCallResult.reverted) {
    log.info("Lido call reverted", []);
  } else {
    totalShares = getTotalSharesCallResult.value;
  }

  // get node operators
  let sender = event.params.from;
  let recipient = event.params.to;
  let value = event.params.value;

  let nodeOperators: Address[] = [];
  let nodeOperatorsRegistry = NodeOperatorsRegistry.bind(
    Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID)
  );
  let getRewardsDistributionCallResult = nodeOperatorsRegistry.try_getRewardsDistribution(
    BIGINT_ZERO
  );
  if (getRewardsDistributionCallResult.reverted) {
    log.info("NodeOperatorsRegistry call reverted", []);
  } else {
    nodeOperators = getRewardsDistributionCallResult.value.getRecipients();
  }

  const fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  const isMintToTreasury =
    fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  const isMintToNodeOperators = fromZeros && nodeOperators.includes(recipient);
  const pool = getOrCreatePool(event.block.number, event.block.timestamp);

  // update metrics
  if (isMintToTreasury || isMintToNodeOperators) {
    updateSnapshotsTvl(event.block);
    updateProtocolSideRevenueMetrics(event.block, value);
    if (totalShares > pool.outputTokenSupply!) {
      updateTotalRevenueMetrics(
        event.block,
        preTotalPooledEther,
        postTotalPooledEther,
        totalShares
      );
    }
    updateSupplySideRevenueMetrics(event.block);
  }
}
