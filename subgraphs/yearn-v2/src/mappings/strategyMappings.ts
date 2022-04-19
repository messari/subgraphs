import { Strategy as StrategyTemplate } from "../../generated/templates";
import { Cloned as ClonedEvent } from "../../generated/templates/Strategy/Strategy";

export function handleCloned(event: ClonedEvent): void {
  const clonedStrategyAddress = event.params.clone;

  StrategyTemplate.create(clonedStrategyAddress);
}
