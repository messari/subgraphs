import { RewardPaid, Staked, Withdrawn } from "../../../../../generated/templates/StakingRewards/StakingRewards";
import {
  handleRewardPaidImpl,
  handleStakedImpl,
  handleWithdrawnImpl,
} from "../../common/handlers/handleReward";

export function handleStaked(
  event: Staked,
): void {
  handleStakedImpl(event, event.params.amount);
}

export function handleWithdrawn(
  event: Withdrawn,
): void {
  handleWithdrawnImpl(event, event.params.amount);
}

export function handleRewardPaid(
  event: RewardPaid
): void {
  handleRewardPaidImpl(event, event.params.reward);
}