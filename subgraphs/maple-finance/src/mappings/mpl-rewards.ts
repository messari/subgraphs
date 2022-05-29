import {
  RewardAdded as RewardAddedEvent,
  RewardsDurationUpdated as RewardsDurationUpdatedEvent
} from "../../generated/templates/MplRewards/MplRewards";

export function handleStake(event: RewardAddedEvent): void {}

export function handleUnstake(event: RewardsDurationUpdatedEvent): void {}
