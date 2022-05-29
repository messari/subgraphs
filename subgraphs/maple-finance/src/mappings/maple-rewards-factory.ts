import { MplRewardsCreated as MplRewardsCreatedEvent } from "../../generated/MapleRewardsFactory/MapleRewardsFactory";

export function handleMplRewardsCreated(event: MplRewardsCreatedEvent): void {
  // Accessing event data
  event.block.timestamp;
  event.transaction.from;
}
