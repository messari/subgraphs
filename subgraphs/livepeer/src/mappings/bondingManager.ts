import {
  Bond,
  EarningsClaimed,
  Rebond,
  Reward,
  TranscoderActivated,
  TranscoderDeactivated,
  TranscoderSlashed,
  TranscoderUpdate,
  TransferBond,
  Unbond,
  WithdrawFees,
  WithdrawStake,
} from "../../generated/BondingManager/BondingManager";
import { trackUsageMetrics } from "../modules/Metrics";
import { createOrUpdatePool } from "../common/initializers";

export function bond(event: Bond): void {
  createOrUpdatePool(event.params.newDelegate, event);
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.newDelegate, event);
}

export function transferBond(event: TransferBond): void {
  trackUsageMetrics(event.params.newDelegator, event);
  trackUsageMetrics(event.params.oldDelegator, event);
}

export function unbond(event: Unbond): void {
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
  createOrUpdatePool(event.params.delegate, event);
}

export function rebond(event: Rebond): void {
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
}

export function withdrawStake(event: WithdrawStake): void {
  trackUsageMetrics(event.params.delegator, event);
}

export function withdrawFees(event: WithdrawFees): void {
  trackUsageMetrics(event.params.delegator, event);
}

export function reward(event: Reward): void {
  trackUsageMetrics(event.params.transcoder, event);
}

export function transcoderSlashed(event: TranscoderSlashed): void {
  createOrUpdatePool(event.params.transcoder, event);
  trackUsageMetrics(event.params.transcoder, event);
}

export function transcoderUpdate(event: TranscoderUpdate): void {
  trackUsageMetrics(event.params.transcoder, event);
  createOrUpdatePool(event.params.transcoder, event);
}

export function transcoderActivated(event: TranscoderActivated): void {
  createOrUpdatePool(event.params.transcoder, event);
  trackUsageMetrics(event.params.transcoder, event);
}

export function transcoderDeactivated(event: TranscoderDeactivated): void {
  createOrUpdatePool(event.params.transcoder, event);
  trackUsageMetrics(event.params.transcoder, event);
}

export function earningsClaimed(event: EarningsClaimed): void {
  createOrUpdatePool(event.params.delegate, event);
  trackUsageMetrics(event.params.delegator, event);
  trackUsageMetrics(event.params.delegate, event);
}
