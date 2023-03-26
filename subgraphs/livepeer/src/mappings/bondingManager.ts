// Import event types from the registrar contract ABIs
import {
  Bond,
  EarningsClaimed,
  ParameterUpdate,
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
import { log } from "@graphprotocol/graph-ts";
import { createOrUpdatePool } from "../common/initializers";

export function bond(event: Bond): void {
  log.warning("[Bond]", []);

  createOrUpdatePool(event.params.newDelegate, event);
}

export function transferBond(event: TransferBond): void {}

// Handler for Unbond events
export function unbond(event: Unbond): void {
  log.warning("[Unbond]", []);

  createOrUpdatePool(event.params.delegate, event);
}

// Handler for Rebond events
export function rebond(event: Rebond): void {
  log.warning("[Rebond]", []);

  // createPool(event.params.delegate, event);
}

// Handler for WithdrawStake events
export function withdrawStake(event: WithdrawStake): void {}

export function withdrawFees(event: WithdrawFees): void {}

export function parameterUpdate(event: ParameterUpdate): void {}

// Handler for Reward events
export function reward(event: Reward): void {
  log.warning("[Reward]", []);

  createOrUpdatePool(event.params.transcoder, event);
}

// Handler for TranscoderSlashed events
export function transcoderSlashed(event: TranscoderSlashed): void {
  createOrUpdatePool(event.params.transcoder, event);
}

export function transcoderUpdate(event: TranscoderUpdate): void {
  createOrUpdatePool(event.params.transcoder, event);
}

export function transcoderActivated(event: TranscoderActivated): void {
  createOrUpdatePool(event.params.transcoder, event);
}

export function transcoderDeactivated(event: TranscoderDeactivated): void {
  createOrUpdatePool(event.params.transcoder, event);
}

export function earningsClaimed(event: EarningsClaimed): void {
  createOrUpdatePool(event.params.delegate, event);
}
