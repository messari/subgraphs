import {
  Bond,
  EarningsClaimed,
  Rebond,
  Reward,
  TranscoderActivated,
  TranscoderDeactivated,
  TranscoderUpdate,
  TransferBond,
  Unbond,
  WithdrawFees,
  WithdrawStake,
} from "../../generated/BondingManager/BondingManager";
import { trackUsageMetrics } from "../modules/metrics";
import { createOrUpdatePool } from "../common/initializers";

export function handleBond(event: Bond): void {
  createOrUpdatePool(event.params.newDelegate, event);
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.newDelegate, event);
}

export function handleTransferBond(event: TransferBond): void {
  trackUsageMetrics(event.params.newDelegator, event);
  trackUsageMetrics(event.params.oldDelegator, event);
}

export function handleUnbond(event: Unbond): void {
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
  createOrUpdatePool(event.params.delegate, event);
}

export function handleRebond(event: Rebond): void {
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
}

export function handleWithdrawStake(event: WithdrawStake): void {
  trackUsageMetrics(event.params.delegator, event);
}

export function handleWithdrawFees(event: WithdrawFees): void {
  trackUsageMetrics(event.params.delegator, event);
}

export function handleReward(event: Reward): void {
  trackUsageMetrics(event.params.transcoder, event);
}

export function handleTranscoderUpdate(event: TranscoderUpdate): void {
  trackUsageMetrics(event.params.transcoder, event);
  createOrUpdatePool(event.params.transcoder, event);
}

export function handleTranscoderActivated(event: TranscoderActivated): void {
  createOrUpdatePool(event.params.transcoder, event);
  trackUsageMetrics(event.params.transcoder, event);
}

export function handleTranscoderDeactivated(
  event: TranscoderDeactivated
): void {
  createOrUpdatePool(event.params.transcoder, event);
  trackUsageMetrics(event.params.transcoder, event);
}

export function handleEarningsClaimed(event: EarningsClaimed): void {
  createOrUpdatePool(event.params.delegate, event);
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
}
