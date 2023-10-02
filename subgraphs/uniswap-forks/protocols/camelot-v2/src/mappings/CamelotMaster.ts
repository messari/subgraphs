import {
  PoolAdded as PoolAddedEvent,
  PoolSet as PoolSetEvent,
  PoolUpdated as PoolUpdatedEvent,
} from "../../../../generated/CamelotMaster/CamelotMaster";

import { handleReward } from "../common/handlers";

export function handlePoolAdded(event: PoolAddedEvent): void {
  handleReward(event, event.params.poolAddress);
}

export function handlePoolSet(event: PoolSetEvent): void {
  handleReward(event, event.params.poolAddress);
}

export function handlePoolUpdated(event: PoolUpdatedEvent): void {
  handleReward(event, event.params.poolAddress);
}
