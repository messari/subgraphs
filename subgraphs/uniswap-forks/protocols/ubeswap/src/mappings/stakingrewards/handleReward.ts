import {
  RewardPaid,
  Staked,
  Withdrawn,
} from "../../../../../generated/templates/StakingRewards/StakingRewards";
import { BIGINT_NEG_ONE } from "../../../../../src/common/constants";
import {} from "../../../../../src/common/getters";
import {
  updateRewardEmissions,
  updateStakedAmount,
} from "../../common/helpers";

// Load in the liquidity pool entity associated with this staking pool and increase staked amount
export function handleStaked(event: Staked): void {
  updateStakedAmount(event, event.params.amount);
  updateRewardEmissions(event);
}

// Load in the liquidity pool entity associated with this staking pool and decrease staked amount
export function handleWithdrawn(event: Withdrawn): void {
  updateStakedAmount(event, event.params.amount.times(BIGINT_NEG_ONE));
  updateRewardEmissions(event);
}

// Handle reward emmissions calculations within this handler.
export function handleRewardPaid(event: RewardPaid): void {
  updateRewardEmissions(event);
}
