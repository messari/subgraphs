import { STAKED_SPELL } from "./common/constants";
import { Transfer } from "../generated/Spell/ERC20";
import { updateUsageMetrics } from "./common/metrics";

// handle staking events which are spell transfers to and from sspell
// updates treasury and usageMetrics

export function handleTransfer(event: Transfer): void {
  if (event.params.to.toHexString() == STAKED_SPELL) {
    // stake spell into sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.from, event.params.from);
  } else if (event.params.from.toHexString() == STAKED_SPELL) {
    // withdraw spell from sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.to, event.params.to);
  }
}
