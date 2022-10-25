import { NewSwapPool } from "../../generated/templates/Swap/SwapDeployer";
import { createPoolFromFactoryEvent } from "../entities/pool";

export function handleNewSwapPool(event: NewSwapPool): void {
<<<<<<< HEAD
  createPoolFromFactoryEvent(event)
=======
  createPoolFromFactoryEvent(event);
>>>>>>> 824f39ea (fix commits)
}
