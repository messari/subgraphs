import { RewardsClaimed } from "../../../generated/MembershipDirector/MembershipDirector";

import { createTransactionFromEvent } from "../../entities/helpers";

export function handleRewardsClaimed(event: RewardsClaimed): void {
  const transaction = createTransactionFromEvent(
    event,
    "MEMBERSHIP_REWARDS_CLAIMED",
    event.params.owner
  );
  transaction.receivedAmount = event.params.rewards;
  transaction.receivedToken = "FIDU";
  transaction.save();
}
