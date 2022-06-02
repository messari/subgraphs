import { log, Address } from "@graphprotocol/graph-ts";
import { stablecoin, Transfer } from "../generated/USX/stablecoin";
import { getOrCreateFinancialsDailySnapshot, getOrCreateProtocol } from "./common/getters";
import { ZERO_ADDRESS } from "./common/constants";

// update USX/EUX supply for
//    - protocol.mintedTokens
//    - protocl.mintedTokensSupplies
//    - FinancialsDailySnapshot.mintedTokensSupplies
export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() != ZERO_ADDRESS && event.params.to.toHexString() != ZERO_ADDRESS) {
    // supply won't change for non-minting/burning transfers
    log.info("Not a minting or burning event, skipping", []);
    return;
  }

  let tokenId = event.address.toHexString();
  let protocol = getOrCreateProtocol();

  let contract = stablecoin.bind(event.address);
  let supply = contract.totalSupply();
  // since mintedTokens is sorted, we need to make sure
  // mintedTokenSupplies is sorted in the same order
  if (protocol.mintedTokens == null || protocol.mintedTokens!.length == 0) {
    protocol.mintedTokens = [tokenId];
    protocol.mintedTokenSupplies = [supply];
  } else {
    let tokenIndex = protocol.mintedTokens!.indexOf(tokenId);
    if (tokenIndex > 0) {
      // token already in protocol.mintedTokens
      protocol.mintedTokenSupplies![tokenIndex] = supply;
    } else {
      if (tokenId < protocol.mintedTokens![0]) {
        // insert as the first token into mintedTokens
        protocol.mintedTokens = [tokenId].concat(protocol.mintedTokens!);
        protocol.mintedTokenSupplies = [supply].concat(protocol.mintedTokenSupplies!);
      } else {
        // insert as the last token into mintedTokens
        protocol.mintedTokens!.push(tokenId);
        protocol.mintedTokenSupplies!.push(supply);
      }
    }
  }

  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  // There is no financialMetrics.mintedTokens in the schema
  // financialMetrics.mintedTokens = mintedTokens;
  financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialMetrics.save();
}
