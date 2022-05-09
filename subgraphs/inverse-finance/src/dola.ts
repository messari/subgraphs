import { log } from "@graphprotocol/graph-ts";
import { DOLA, Transfer } from "../generated/DOLA/DOLA";
import { getOrCreateFinancialsDailySnapshot, getOrCreateProtocol, getOrCreateToken } from "./common/getters";
import { ZERO_ADDRESS } from "./common/constants";

// update DOLA supply for
//    - protocol.mintedTokens
//    - protocl.mintedTokensSupplies
//    - FinancialsDailySnapshot.mintedTokens
//    - FinancialsDailySnapshot.mintedTokensSupplies
export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() != ZERO_ADDRESS && event.params.to.toHexString() != ZERO_ADDRESS) {
    log.info("Not a minting or burning event, skipping", []);
    return;
  }
  let token = getOrCreateToken(event.address);
  let protocol = getOrCreateProtocol();

  let dolaContract = DOLA.bind(event.address);
  let supply = dolaContract.totalSupply();
  let mintedTokens = protocol.mintedTokens;
  let mintedTokensSupplies = protocol.mintedTokenSupplies;
  if (mintedTokens == null) {
    // this should not happen, just in case
    mintedTokens = [token.id];
    mintedTokensSupplies = [supply];
  } else {
    let indexDOLA = mintedTokens.indexOf(token.id);
    if (indexDOLA == -1) {
      // DOLA is not one of protocol.mintedTokens, insert it & its supply
      mintedTokens = [token.id].concat(mintedTokens);
      mintedTokensSupplies = [supply].concat(mintedTokensSupplies!);
    } else {
      // DOLA is one of protocol.mintedTokens, update DOLA supply
      mintedTokensSupplies![indexDOLA] = supply;
    }
  }

  protocol.mintedTokens = mintedTokens;
  protocol.mintedTokenSupplies = mintedTokensSupplies;
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  // financialMetrics.mintedTokens doesn't exist in the schema
  // financialMetrics.mintedTokens = mintedTokens;
  financialMetrics.mintedTokenSupplies = mintedTokensSupplies;
  financialMetrics.save();
}
