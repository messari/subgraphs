import { getOrCreateToken } from "../common/initializers";
import { updateRewardTokenInfo } from "../modules/Rewards";
import { UnlockScheduleSet } from "../../generated/templates/Strategy/RewardsLogger";

export function handleUnlockScheduleSet(event: UnlockScheduleSet): void {
  const duration = event.params.duration;
  const rewardToken = event.params.token;
  const totalAmount = event.params.totalAmount;
  const vaultAddress = event.params.beneficiary;

  const rewardRate = totalAmount.div(duration);

  updateRewardTokenInfo(
    vaultAddress,
    getOrCreateToken(rewardToken, event.block),
    rewardRate,
    event.block
  );
}
