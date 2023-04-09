import { Address, log } from "@graphprotocol/graph-ts";
import { MplRewardsCreated as MplRewardsCreatedEvent } from "../../generated/MapleRewardsFactory/MapleRewardsFactory";
import { MplReward as MplRewardTemplate } from "../../generated/templates";

import { getOrCreateMarket, getOrCreateMplReward } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";

export function handleMplRewardsCreated(event: MplRewardsCreatedEvent): void {
    const mplRewardAddress = event.params.mplRewards;

    ////
    // Create mpl rewards templates
    ////
    MplRewardTemplate.create(mplRewardAddress);

    ////
    // Create mpl rewards entity
    ////
    const mplReward = getOrCreateMplReward(event, mplRewardAddress);

    ////
    // Update market
    ////
    const market = getOrCreateMarket(event, Address.fromString(mplReward.market));
    const rewardToken = getOrCreateToken(Address.fromString(mplReward.rewardToken));

    // Add the mplReward
    if (market.id == mplReward.stakeToken) {
        // MPL-LP
        if (market._mplRewardMplLp) {
            log.warning("Overwritting _mplRewardMplLp for market {}", [market.id]);
        }
        market._mplRewardMplLp = mplReward.id;
    } else {
        // MPL-STAKE
        if (market._mplRewardMplStake) {
            log.warning("Overwritting _mplRewardMplStake for market {}", [market.id]);
        }
        market._mplRewardMplStake = mplReward.id;
    }

    // Add reward token to market if it doesn't exist
    let newRewardTokenForMarket = true;
    for (let i = 0; i < market.rewardTokens.length; i++) {
        if (market.rewardTokens[i] == rewardToken.id) {
            newRewardTokenForMarket = false;
        }
    }

    if (newRewardTokenForMarket) {
        const newRewardTokens = market.rewardTokens;
        newRewardTokens.push(rewardToken.id);
        market.rewardTokens = newRewardTokens;
    }
    market.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}
