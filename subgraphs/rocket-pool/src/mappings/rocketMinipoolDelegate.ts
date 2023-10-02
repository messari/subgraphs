import { BigInt } from "@graphprotocol/graph-ts";
import {
  EtherDeposited,
  StatusUpdated,
} from "../../generated/templates/rocketMinipoolDelegate/rocketMinipoolDelegate";
import { Minipool, Node } from "../../generated/schema";
import {
  MINIPOOLSTATUS_STAKING,
  MINIPOOLSTATUS_WITHDRAWABLE,
} from "../constants/enumConstants";
import { RocketContractNames } from "../constants/contractConstants";
import { updateUsageMetrics } from "../updaters/usageMetrics";
import { getRocketContract } from "../entities/rocketContracts";

/**
 * Occurs when a node operator makes an ETH deposit on his node to create a minipool.
 */
export function handleStatusUpdated(event: StatusUpdated): void {
  // Preliminary null checks.
  if (event === null || event.address === null || event.block === null) return;

  // There must be an existing minipool with the same address.
  const minipool = Minipool.load(event.address.toHexString());
  if (minipool === null || minipool.node == null) return;

  // Retrieve the parent node. It has to exist.
  const node = Node.load(minipool.node);
  if (node === null) return;

  // Handle the status.
  if (event.params.status == MINIPOOLSTATUS_STAKING)
    handleMinipoolStakingStatus(node, minipool, event.block.timestamp);
  else if (event.params.status == MINIPOOLSTATUS_WITHDRAWABLE)
    handleMinipoolWithdrawableStatus(node, minipool, event.block.timestamp);

  // Index the minipool and the associated node.
  minipool.save();
  node.save();

  updateUsageMetrics(event.block, event.address);
}

/**
 * Occurs when a minipool receives an ETH deposit either from a node operator or the deposit pool.
 */
export function handleEtherDeposited(event: EtherDeposited): void {
  // Preliminary null checks.
  if (
    event === null ||
    event.params === null ||
    event.address === null ||
    event.block === null
  )
    return;

  // There must be an existing minipool with the same address.
  const minipool = Minipool.load(event.address.toHexString());
  if (minipool === null) return;

  // Get the address of the rocket node deposit contract.
  // Check if the deposit came from a node.
  const nodeDepositContractEntity = getRocketContract(
    RocketContractNames.ROCKET_NODE_DEPOSIT
  );
  if (nodeDepositContractEntity.allAddresses.includes(event.params.from)) {
    // The deposit came from a node and is a 'node' deposit.
    minipool.nodeDepositBlockTime = event.block.timestamp;
    minipool.nodeDepositETHAmount = event.params.amount;
  } else {
    // The deposit came from the deposit pool and is a 'user' deposit.
    minipool.userDepositBlockTime = event.block.timestamp;
    minipool.userDepositETHAmount = event.params.amount;
  }

  // Index the minipool changes.
  minipool.save();

  updateUsageMetrics(event.block, event.address);
}

/**
 * Handle the change of state to 'Staking' for a minipool.
 */
export function handleMinipoolStakingStatus(
  node: Node,
  minipool: Minipool,
  blockTimeStamp: BigInt
): void {
  if (minipool.stakingBlockTime == BigInt.fromI32(0)) {
    // Update the staking start time of this minipool.
    minipool.stakingBlockTime = blockTimeStamp;
    node.stakingMinipools = node.stakingMinipools.plus(BigInt.fromI32(1));

    // If we transition to staking and have a 0 node deposit amount, then
    // we can be sure that this is an unbonded minipool.
    if (
      minipool.nodeDepositETHAmount == BigInt.fromI32(0) &&
      minipool.userDepositETHAmount > BigInt.fromI32(0)
    ) {
      node.stakingUnbondedMinipools = node.stakingUnbondedMinipools.plus(
        BigInt.fromI32(1)
      );
    }
  }
}

/**
 * Handle the change of state to 'Withdrawable' for a minipool.
 */
export function handleMinipoolWithdrawableStatus(
  node: Node,
  minipool: Minipool,
  blockTimeStamp: BigInt
): void {
  if (minipool.withdrawableBlockTime == BigInt.fromI32(0)) {
    // Update the withdrawal block time and the total withdrawable minipool counter of this minipool.
    minipool.withdrawableBlockTime = blockTimeStamp;
    node.withdrawableMinipools = node.withdrawableMinipools.plus(
      BigInt.fromI32(1)
    );

    // Decrement the number of staking minipools for the node.
    node.stakingMinipools = node.stakingMinipools.minus(BigInt.fromI32(1));
    if (node.stakingMinipools < BigInt.fromI32(0))
      node.stakingMinipools = BigInt.fromI32(0);

    // If we transition to withdrawable and have a 0 node deposit amount, then
    // we can be sure that this is an unbonded minipool.
    if (
      minipool.nodeDepositETHAmount == BigInt.fromI32(0) &&
      minipool.userDepositETHAmount > BigInt.fromI32(0) &&
      node.stakingUnbondedMinipools > BigInt.fromI32(0)
    ) {
      node.stakingUnbondedMinipools = node.stakingUnbondedMinipools.minus(
        BigInt.fromI32(1)
      );
    }
  }
}
