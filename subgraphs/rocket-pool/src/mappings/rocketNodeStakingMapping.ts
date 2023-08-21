import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  RPLStaked,
  RPLSlashed,
  RPLWithdrawn,
} from "../../generated/templates/rocketNodeStaking/rocketNodeStaking";
import { rocketNetworkPrices } from "../../generated/templates/rocketNodeStaking/rocketNetworkPrices";
import { rocketNodeStaking } from "../../generated/templates/rocketNodeStaking/rocketNodeStaking";
import { ONE_ETHER_IN_WEI } from "../constants/generalConstants";
import { RocketContractNames } from "../constants/contractConstants";
import {
  NODERPLSTAKETRANSACTIONTYPE_STAKED,
  NODERPLSTAKETRANSACTIONTYPE_WITHDRAWAL,
  NODERPLSTAKETRANSACTIONTYPE_SLASHED,
} from "../constants/enumConstants";
import { Node } from "../../generated/schema";
import { ethereum } from "@graphprotocol/graph-ts";
import { generalUtilities } from "../checkpoints/generalUtilities";
import { rocketPoolEntityFactory } from "../entityFactory";
import { updateUsageMetrics } from "../updaters/usageMetrics";
import { getRocketContract } from "../entities/rocketContracts";

/**
 * Occurs when a node operator stakes RPL on his node to collaterize his minipools.
 */
export function handleRPLStaked(event: RPLStaked): void {
  if (event === null || event.params === null || event.params.from === null)
    return;

  saveNodeRPLStakeTransaction(
    event,
    event.params.from.toHexString(),
    NODERPLSTAKETRANSACTIONTYPE_STAKED,
    event.params.amount
  );
  updateUsageMetrics(event.block, event.params.from);
}

/**
 * Occurs when RPL is slashed to cover staker losses.
 */
export function handleRPLSlashed(event: RPLSlashed): void {
  if (event === null || event.params === null || event.params.node === null)
    return;

  saveNodeRPLStakeTransaction(
    event,
    event.params.node.toHexString(),
    NODERPLSTAKETRANSACTIONTYPE_SLASHED,
    event.params.amount
  );
  updateUsageMetrics(event.block, event.params.node);
}

/**
 * Occurs when a node operator withdraws RPL from his node.
 */
export function handleRPLWithdrawn(event: RPLWithdrawn): void {
  if (event === null || event.params === null || event.params.to === null)
    return;

  saveNodeRPLStakeTransaction(
    event,
    event.params.to.toHexString(),
    NODERPLSTAKETRANSACTIONTYPE_WITHDRAWAL,
    event.params.amount
  );
  updateUsageMetrics(event.block, event.params.to);
}

/**
 * Save a new RPL stake transaction.
 */
function saveNodeRPLStakeTransaction(
  event: ethereum.Event,
  nodeId: string,
  transactionType: string,
  amount: BigInt
): void {
  // This state has to be valid before we can actually do anything.
  if (
    event === null ||
    event.block === null ||
    nodeId == null ||
    transactionType == null ||
    amount === BigInt.fromI32(0)
  )
    return;

  // We can only handle an Node RPL transaction if the node exists.
  const node = Node.load(nodeId);
  if (node === null) return;

  // Load the storage contract because we need to get the rETH contract address. (and some of its state)
  const rocketNetworkPricesContractEntity = getRocketContract(
    RocketContractNames.ROCKET_NETWORK_PRICES
  );
  const rocketNetworkPricesContract = rocketNetworkPrices.bind(
    Address.fromBytes(rocketNetworkPricesContractEntity.latestAddress)
  );

  // Calculate the ETH amount at the time of the transaction.
  const rplPriceCall = rocketNetworkPricesContract.try_getRPLPrice();
  if (rplPriceCall.reverted) return;
  const rplETHExchangeRate = rplPriceCall.value;
  const ethAmount = amount.times(rplETHExchangeRate).div(ONE_ETHER_IN_WEI);

  // Create a new transaction for the given values.
  const nodeRPLStakeTransaction =
    rocketPoolEntityFactory.createNodeRPLStakeTransaction(
      generalUtilities.extractIdForEntity(event),
      nodeId,
      amount,
      ethAmount,
      transactionType,
      event.block.number,
      event.block.timestamp
    );
  if (nodeRPLStakeTransaction === null) return;

  // Update node RPL balances & index those changes.
  updateNodeRPLBalances(<Node>node, amount, transactionType);

  // Index
  nodeRPLStakeTransaction.save();
  node.save();
}

/**
 * After a transaction, the node RPL staking state must be brought up to date.
 */
function updateNodeRPLBalances(
  node: Node,
  amount: BigInt,
  transactionType: string
): void {
  // We will need the rocket node staking contract to get some latest state for the associated node.
  const rocketNodeStakingContractEntity = getRocketContract(
    RocketContractNames.ROCKET_NODE_STAKING
  );
  const rocketNodeStakingContract = rocketNodeStaking.bind(
    Address.fromBytes(rocketNodeStakingContractEntity.latestAddress)
  );

  const nodeAddress = Address.fromString(node.id);

  const nodeRPLStakeCall =
    rocketNodeStakingContract.try_getNodeRPLStake(nodeAddress);
  if (nodeRPLStakeCall.reverted) return;
  node.rplStaked = nodeRPLStakeCall.value;

  const nodeEffectiveRPLStakeCall =
    rocketNodeStakingContract.try_getNodeEffectiveRPLStake(nodeAddress);
  if (nodeEffectiveRPLStakeCall.reverted) return;
  node.effectiveRPLStaked = nodeEffectiveRPLStakeCall.value;

  // This isn't accessible via smart contracts, so we have to keep track manually.
  if (
    transactionType == NODERPLSTAKETRANSACTIONTYPE_SLASHED &&
    amount > BigInt.fromI32(0)
  ) {
    node.totalRPLSlashed = node.totalRPLSlashed.plus(amount);
  }
}
