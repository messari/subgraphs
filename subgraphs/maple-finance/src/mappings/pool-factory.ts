import { PoolCreated as PoolCreatedEvent } from "../../generated/templates/PoolFactory/PoolFactory";

export function handlePoolCreated(event: PoolCreatedEvent): void {
  // Accessing the event parameters
  event.params.delegate;

  // Accessing event data
  event.block.timestamp;
  event.transaction.from;
}
