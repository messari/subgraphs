import { log } from "@graphprotocol/graph-ts";
import { DOLA, Transfer } from "../generated/DOLA/DOLA";
import { getOrCreateFinancialsDailySnapshot, getOrCreateProtocol, getOrCreateToken } from "./common/getters";
import { ZERO_ADDRESS } from "./common/constants";

// update DOLA supply for
//    - protocol.mintedTokens
//    - protocl.mintedTokensSupplies
//    - FinancialsDailySnapshot.mintedTokensSupplies
export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() != ZERO_ADDRESS && event.params.to.toHexString() != ZERO_ADDRESS) {
    log.info("Not a minting or burning event, skipping", []);
    return;
  }

  let protocol = getOrCreateProtocol();

  let dolaContract = DOLA.bind(event.address);
  let supply = dolaContract.totalSupply();
  if ( protocol.mintedTokens == null || protocol.mintedTokens!.length == 0 ) {
    protocol.mintedTokens = [event.address.toHexString()]
  }

  protocol.mintedTokenSupplies = [supply];
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  // There is no financialMetrics.mintedTokens in the schema
  // financialMetrics.mintedTokens = mintedTokens;
  financialMetrics.mintedTokenSupplies = [supply];
  financialMetrics.save();
}
