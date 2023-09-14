import { BigInt, Address } from "@graphprotocol/graph-ts";
import { generalUtilities } from "../checkpoints/generalUtilities";
import { rocketPoolEntityFactory } from "../entityFactory";
import { Node, NetworkNodeTimezone } from "../../generated/schema";
import {
  rocketNodeManager,
  NodeRegistered,
  NodeTimezoneLocationSet,
} from "../../generated/templates/rocketNodeManager/rocketNodeManager";
import { updateUsageMetrics } from "../updaters/usageMetrics";
/**
 * Occurs when a node operator registers his address with the RocketPool protocol.
 */
export function handleNodeRegister(event: NodeRegistered): void {
  // Preliminary null checks.
  if (event === null || event.params === null || event.params.node === null)
    return;

  // We can only register an address as a node if it hasn't been registered yet.
  let node = Node.load(event.params.node.toHex());
  if (node !== null) return;

  // Retrieve the associated timezone, if the timezone doesn't exist yet, we need to create it.
  const nodeTimezoneStringId = getNodeTimezoneId(
    event.params.node.toHex(),
    event.address
  );
  let nodeTimezone = NetworkNodeTimezone.load(nodeTimezoneStringId);
  if (nodeTimezone === null || nodeTimezone.id == null) {
    nodeTimezone =
      rocketPoolEntityFactory.createNodeTimezone(nodeTimezoneStringId);
    nodeTimezone.block = event.block.number;
    nodeTimezone.blockTime = event.block.timestamp;
  }

  // Increment the total registered nodes for this timezone.
  nodeTimezone.totalRegisteredNodes = nodeTimezone.totalRegisteredNodes.plus(
    BigInt.fromI32(1)
  );

  // Create the node for this timezone and index it.
  node = rocketPoolEntityFactory.createNode(
    event.params.node.toHexString(),
    nodeTimezone.id,
    event.block.number,
    event.block.timestamp
  );
  if (node === null) return;

  // Protocol entity should exist, if not, then we attempt to create it.
  let protocol = generalUtilities.getRocketPoolProtocolEntity();
  if (protocol === null || protocol.id == null) {
    protocol = rocketPoolEntityFactory.createRocketPoolProtocol();
  }

  // Add this node to the collection of the protocol if necessary and index.
  const protocolNodes = protocol.nodes;
  if (protocol.nodes.indexOf(node.id) == -1) protocolNodes.push(node.id);
  protocol.nodes = protocolNodes;

  // Index changes.
  node.save();
  nodeTimezone.save();
  protocol.save();

  updateUsageMetrics(event.block, event.params.node);
}

/**
 * Occurs when a node operator changes his timzone in the RocketPool protocol.
 */
export function handleNodeTimezoneChanged(
  event: NodeTimezoneLocationSet
): void {
  if (event === null || event.params === null || event.params.node === null)
    return;

  // The node in question has to exist before we can change its timezone.
  const node = Node.load(event.params.node.toHexString());
  if (node === null) return;

  let oldNodeTimezone: NetworkNodeTimezone | null = null;

  // Decrement the total registered nodes for the old timezone.
  if (node.timezone != null) {
    oldNodeTimezone = NetworkNodeTimezone.load(node.timezone);
    if (oldNodeTimezone !== null) {
      oldNodeTimezone.totalRegisteredNodes =
        oldNodeTimezone.totalRegisteredNodes.minus(BigInt.fromI32(1));
      if (oldNodeTimezone.totalRegisteredNodes < BigInt.fromI32(0)) {
        oldNodeTimezone.totalRegisteredNodes = BigInt.fromI32(0);
      }
    }
  }

  // If the newly set timezone doesn't exist yet, we need to create it.
  const newNodeTimezoneId = getNodeTimezoneId(
    event.params.node.toHex(),
    event.address
  );
  let newNodeTimezone: NetworkNodeTimezone | null = null;
  if (newNodeTimezoneId != null) {
    newNodeTimezone = NetworkNodeTimezone.load(newNodeTimezoneId);
    if (newNodeTimezone === null || newNodeTimezone.id == null) {
      newNodeTimezone =
        rocketPoolEntityFactory.createNodeTimezone(newNodeTimezoneId);
      newNodeTimezone.block = event.block.number;
      newNodeTimezone.blockTime = event.block.timestamp;
    }

    // Increment the total registered nodes for the new timezone and index.
    newNodeTimezone.totalRegisteredNodes =
      newNodeTimezone.totalRegisteredNodes.plus(BigInt.fromI32(1));
  }

  if (oldNodeTimezone !== null) oldNodeTimezone.save();
  if (newNodeTimezone !== null) newNodeTimezone.save();

  updateUsageMetrics(event.block, event.params.node);
}

/**
 * Returns the node timezone identifier based on what was in the smart contracts.
 */
function getNodeTimezoneId(
  nodeAddress: string,
  nodeManagerContractAddress: Address
): string {
  let nodeTimezoneStringId = "UNKNOWN";

  const rocketNodeManagerContract = rocketNodeManager.bind(
    nodeManagerContractAddress
  );
  const nodeTimezoneLocationCall =
    rocketNodeManagerContract.try_getNodeTimezoneLocation(
      Address.fromString(nodeAddress)
    );
  if (!nodeTimezoneLocationCall.reverted)
    nodeTimezoneStringId = nodeTimezoneLocationCall.value;

  return nodeTimezoneStringId;
}
