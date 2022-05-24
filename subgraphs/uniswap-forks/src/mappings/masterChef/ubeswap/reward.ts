import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { Transfer } from "../../../../generated/Factory/TokenABI";
import { RewardPaid, Staked, Withdrawn } from "../../../../generated/templates/StakingRewards/StakingRewards";
import { UsageType } from "../../../common/constants";
import {
  handleRewardPaidImpl,
  handleStakedImpl,
  handleWithdrawnImpl,
} from "../../../common/masterChef/ubeswap/handleReward";
import { updateFinancials, updatePoolMetrics, updateUsageMetrics } from "../../../common/updateMetrics";

export function handleStaked(
  event: Staked,
): void {
  handleStakedImpl(event, event.params.amount);
  updateUsageMetrics(event, event.transaction.from, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleWithdrawn(
  event: Withdrawn,
): void {
  handleWithdrawnImpl(event, event.params.amount);
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleRewardPaid(
  event: RewardPaid
): void {
  handleRewardPaidImpl(event, event.params.reward);
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}