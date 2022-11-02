import { InitializeCall } from "../../generated/LinearTrueDistributor/LinearTrueDistributor";
import { updateProtocolRewardToken } from "../entities/protocol";
import { getOrCreateRewardToken } from "../entities/token";
import { InterestRateType, RewardTokenType } from "../utils/constants";

export function handleInitialize(call: InitializeCall): void {
  const rewardToken = getOrCreateRewardToken(
    call.inputs._trustToken,
    RewardTokenType.DEPOSIT,
    InterestRateType.STABLE,
    call.inputs._distributionStart.plus(call.inputs._duration)
  );

  updateProtocolRewardToken(
    call.block.timestamp,
    rewardToken,
    call.inputs._amount.div(call.inputs._duration)
  );
}
