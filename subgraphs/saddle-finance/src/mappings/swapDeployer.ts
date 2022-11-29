import { NewSwapPool } from "../../generated/templates/Swap/SwapDeployer";
import { createPoolFromFactoryEvent } from "../entities/pool";

export function handleNewSwapPool(event: NewSwapPool): void {
  createPoolFromFactoryEvent(event)
}
