import { BigInt } from "@graphprotocol/graph-ts";
import {
  MinipoolDequeued,
  MinipoolEnqueued,
} from "../../generated/rocketMinipoolqueue/rocketMinipoolqueue";
import { Minipool, Node } from "../../generated/schema";
import { updateUsageMetrics } from "../updaters/usageMetrics";

/**
 * Occurs when a node operator makes an ETH deposit on his node to create a minipool.
 */
export function handleMinipoolEnqueued(event: MinipoolEnqueued): void {
  // Preliminary null checks.
  if (
    event === null ||
    event.params === null ||
    event.params.minipool === null ||
    event.block === null
  )
    return;

  // There must be a minipool that was created, otherwise stop.
  const minipool = Minipool.load(event.params.minipool.toHexString());
  if (minipool === null || minipool.node == null) return;

  // Retrieve the parent node. It has to exist.
  const node = Node.load(minipool.node);
  if (node === null) return;

  // Update the time this minipool was queued.
  minipool.queuedBlockTime = event.block.timestamp;

  // Update the metadata on the node level.
  node.queuedMinipools = node.queuedMinipools.plus(BigInt.fromI32(1));

  // Index the minipool and the associated node.
  minipool.save();
  node.save();

  updateUsageMetrics(event.block, event.address);
}

/**
 * Occurs when a minipool is assigned a user deposit or when a node operator dissolves a minipool before it receives a user deposit.
 */
export function handleMinipoolDequeued(event: MinipoolDequeued): void {
  // Preliminary null checks.
  if (
    event === null ||
    event.params === null ||
    event.params.minipool === null ||
    event.block === null
  )
    return;

  // There must be a minipool that was created, otherwise stop.
  const minipool = Minipool.load(event.params.minipool.toHexString());
  if (minipool === null || minipool.node == null) return;

  // Retrieve the parent node. It has to exist.
  const node = Node.load(minipool.node);
  if (node === null) return;

  // Update the time this minipool was dequeued.
  minipool.dequeuedBlockTime = event.block.timestamp;

  // Update the metadata on the node level.
  node.queuedMinipools = node.queuedMinipools.minus(BigInt.fromI32(1));
  if (node.queuedMinipools < BigInt.fromI32(0))
    node.queuedMinipools = BigInt.fromI32(0);

  // Index the minipool and the associated node.
  minipool.save();
  node.save();

  updateUsageMetrics(event.block, event.address);
}
