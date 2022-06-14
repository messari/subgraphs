import { MplRewardsCreated as MplRewardsCreatedEvent } from "../../generated/MapleRewardsFactory/MapleRewardsFactory";
import { MplReward as MplRewardTemplate } from "../../generated/templates";

import { getOrCreateMplReward } from "../common/mappingHelpers/getOrCreate/markets";

export function handleMplRewardsCreated(event: MplRewardsCreatedEvent): void {
    const mplRewardAddress = event.params.mplRewards;

    // Create mpl rewards templates
    MplRewardTemplate.create(mplRewardAddress);

    // Create mpl rewards entity
    getOrCreateMplReward(event, mplRewardAddress);
}
