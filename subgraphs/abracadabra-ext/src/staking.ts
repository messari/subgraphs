import { dataSource } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/BentoBox/ERC20";
import { getStakedSpellAddress } from "./common/getters";
import { updateUsageMetrics } from "./common/metrics";

// handle staking events which are spell transfers to and from sspell
// updates treasury and usageMetrics

export function handleTransfer(event: Transfer): void {
  //dataSource.network
  if (event.params.to.toHexString() == getStakedSpellAddress(dataSource.network())) {
    // stake spell into sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.from, event.params.from);
  } else if (event.params.from.toHexString() == getStakedSpellAddress(dataSource.network())) {
    // withdraw spell from sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.to, event.params.to);
  }
}
