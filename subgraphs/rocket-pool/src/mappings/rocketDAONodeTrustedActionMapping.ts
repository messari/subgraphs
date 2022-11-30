import {
  ActionJoined,
  ActionLeave,
  ActionKick,
  ActionChallengeDecided,
} from "../../generated/rocketDAONodeTrustedActions/rocketDAONodeTrustedActions";
import { Node } from "../../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { updateUsageMetrics } from "../updaters/usageMetrics";

/**
 * Occurs when a node operator has put up an RPL bond, a consensus is reached and he gets voted in as an ODAO member.
 */
export function handleOracleNodeJoined(event: ActionJoined): void {
  if (
    event === null ||
    event.params === null ||
    event.params.nodeAddress === null
  )
    return;

  updateOracleNodeState(
    event.params.nodeAddress,
    event.params.rplBondAmount,
    true,
    event.params.time
  );
  updateUsageMetrics(event.block, event.address);
}

/**
 * Occurs when a node operator voluntarily leaves the ODAO.
 */
export function handleOracleNodeLeft(event: ActionLeave): void {
  if (
    event === null ||
    event.params === null ||
    event.params.nodeAddress === null
  )
    return;

  updateOracleNodeState(
    event.params.nodeAddress,
    BigInt.fromI32(0),
    false,
    event.params.time
  );
  updateUsageMetrics(event.block, event.address);
}

/**
 * Occurs when a node operator is forced out of the ODAO.
 */
export function handleOracleNodeKicked(event: ActionKick): void {
  if (
    event === null ||
    event.params === null ||
    event.params.nodeAddress === null
  )
    return;

  updateOracleNodeState(
    event.params.nodeAddress,
    BigInt.fromI32(0),
    false,
    event.params.time
  );
  updateUsageMetrics(event.block, event.address);
}

/**
 * Occurs when an ODAO is inactive for a large amount of time and an ODAO is challenged by other ODAO members.
 */
export function handleChallengeDecided(event: ActionChallengeDecided): void {
  if (
    event === null ||
    event.params === null ||
    event.params.nodeChallengedAddress === null
  )
    return;

  if (event.params.success) {
    updateOracleNodeState(
      event.params.nodeChallengedAddress,
      BigInt.fromI32(0),
      false,
      event.params.time
    );
  }
  updateUsageMetrics(event.block, event.address);
}

/**
 * Helper method that encapsulates the loading of a node, setting its ODAO state and indexing.
 */
function updateOracleNodeState(
  nodeAddress: Address,
  rplBondAmount: BigInt,
  isOracleNode: boolean,
  blockTime: BigInt
): void {
  // Load the associated node. It has to exist.
  const node = Node.load(nodeAddress.toHexString());
  if (node === null) return;

  // Update the node state and index it.
  node.isOracleNode = isOracleNode;
  if (isOracleNode) {
    node.oracleNodeRPLBond = rplBondAmount;
  } else {
    node.oracleNodeRPLBond = BigInt.fromI32(0);
  }
  node.oracleNodeBlockTime = blockTime;
  node.save();
}
