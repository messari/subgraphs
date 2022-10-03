import {
  BribeEmission,
  SentBribeToTree,
  SentBribeToGovernance,
  PerformanceFeeGovernance,
} from "../../generated/templates/BribesProcessor/BribesProcessor";

export function handleBribeEmission(event: BribeEmission): void {
  event.params.token
  event.params.amount
}

export function handlePerformanceFeeGovernance(
  event: PerformanceFeeGovernance
): void {
  event.params.token
  event.params.amount
}

export function handleSentBribeToGovernance(
  event: SentBribeToGovernance
): void {
  event.params.token
  event.params.amount
}

export function handleSentBribeToTree(event: SentBribeToTree): void {
  event.params.token
  event.params.amount
}
