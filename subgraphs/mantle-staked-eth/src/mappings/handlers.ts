import { log } from "@graphprotocol/graph-ts";

import {
  Staked,
  UnstakeRequested,
  UnstakeRequestClaimed,
} from "../../generated/Staking/Staking";
import {
  ProtocolConfigChanged,
  FeesCollected,
} from "../../generated/ReturnsAggregator/ReturnsAggregator";

export function handleStaked(event: Staked): void {
  log.debug("[Staked] staker: {} ethAmount: {} mETHAmount: {}", [
    event.params.staker.toHexString(),
    event.params.ethAmount.toString(),
    event.params.mETHAmount.toString(),
  ]);
}

export function handleUnstakeRequested(event: UnstakeRequested): void {
  log.debug(
    "[UnstakeRequested] staker: {} ethAmount: {} mETHLocked: {} id: {}",
    [
      event.params.staker.toHexString(),
      event.params.ethAmount.toString(),
      event.params.mETHLocked.toString(),
      event.params.id.toString(),
    ]
  );
}

export function handleUnstakeRequestClaimed(
  event: UnstakeRequestClaimed
): void {
  log.debug("[UnstakeRequestClaimed] staker: {} id: {}", [
    event.params.staker.toHexString(),
    event.params.id.toString(),
  ]);
}

export function handleProtocolConfigChanged(
  event: ProtocolConfigChanged
): void {
  log.debug(
    "[ProtocolConfigChanged] setterSelector: {} setterSignature: {} value: {}",
    [
      event.params.setterSelector.toHexString(),
      event.params.setterSignature,
      event.params.value.toHexString(),
    ]
  );
}

export function handleFeesCollected(event: FeesCollected): void {
  log.debug("[FeesCollected] amount: {}", [event.params.amount.toString()]);
}
