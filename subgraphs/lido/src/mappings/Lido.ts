import {
  Address,
  ByteArray,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Submitted, Transfer, ETHDistributed } from "../../generated/Lido/Lido";
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
  PROTOCOL_NODE_OPERATORS_REGISTRY_ID,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  PROTOCOL_ID,
  BIGINT_ZERO,
  LIDO_V2_UPGRADE_BLOCK,
  INT_TWO,
  INT_ZERO,
  INT_THREE,
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

  const receipt = event.receipt;
  if (!receipt) return;
  const logs = event.receipt!.logs;
  if (!logs) return;

  const execute_signature = crypto.keccak256(
    ByteArray.fromUTF8("Execute(address,address,uint256,bytes)")
  );
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    if (thisLog.topics.length < INT_THREE) continue;

    const topic_signature = thisLog.topics.at(INT_ZERO);
    const topic_target = ethereum
      .decode("address", thisLog.topics.at(INT_TWO))!
      .toAddress();

    if (
      topic_signature.equals(execute_signature) &&
      topic_target.equals(Address.fromString(PROTOCOL_ID))
    ) {
      log.info(
        "[handleTransfer] Aragon voting. Skipping tx: {} for counting in protocol's revenue.",
        [event.transaction.hash.toHexString()]
      );

      return;
    }
  }

  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(PROTOCOL_ID), event.block.number);

  const fromZeros = sender == Address.fromString(ZERO_ADDRESS);
  const isMintToTreasury =
    fromZeros && recipient == Address.fromString(PROTOCOL_TREASURY_ID);
  let isMintToNodeOperators = false;

  if (event.block.number < LIDO_V2_UPGRADE_BLOCK) {
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

    isMintToNodeOperators =
      fromZeros && (nodeOperators.includes(recipient) as boolean);
  } else {
    isMintToNodeOperators =
      fromZeros &&
      recipient == Address.fromString(PROTOCOL_NODE_OPERATORS_REGISTRY_ID);
  }

  // update metrics
  if (isMintToTreasury || isMintToNodeOperators) {
    updateProtocolSideRevenueMetrics(event.block, value);
    updateSupplySideRevenueMetrics(event.block);
    updateProtocolAndPoolTvl(event.block, BIGINT_ZERO);
  }
}

export function handleETHDistributed(event: ETHDistributed): void {
  if (event.block.number < LIDO_V2_UPGRADE_BLOCK) {
    return;
  }

  // Don’t mint/distribute any protocol fee on the non-profitable Lido oracle report
  // (when beacon chain balance delta is zero or negative).
  // See ADR #3 for details: https://research.lido.fi/t/rewards-distribution-after-the-merge-architecture-decision-record/1535
  const postCLTotalBalance = event.params.postCLBalance.plus(
    event.params.withdrawalsWithdrawn
  );
  if (postCLTotalBalance <= event.params.preCLBalance) {
    return;
  }

  const totalRewards = postCLTotalBalance
    .minus(event.params.preCLBalance)
    .plus(event.params.executionLayerRewardsWithdrawn);

  const lido = Lido.bind(Address.fromString(PROTOCOL_ID));
  const supply = lido.totalSupply();

  updateTotalRevenueMetrics(event.block, totalRewards, supply);
  updateSupplySideRevenueMetrics(event.block);
  updateProtocolAndPoolTvl(event.block, BIGINT_ZERO);
}
