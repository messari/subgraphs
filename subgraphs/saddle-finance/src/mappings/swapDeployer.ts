import { Swap } from "../../generated/templates";
import { NewSwapPool } from "../../generated/USDDeployer/SwapDeployer";
import { createPoolFromEvent } from "../entities/pool";

export function handleNewSwapPool(event: NewSwapPool): void {
  if (createPoolFromEvent(event)) {
    Swap.create(event.params.swapAddress);
  }
}
