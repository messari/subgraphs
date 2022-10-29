import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, Swap, _MultiToken } from "../../generated/schema";
import { TokenCollection } from "../handlers/handleSwapped";

export function createSwap(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  sender: Address,
  tokensInCollection: TokenCollection,
  tokensOutCollection: TokenCollection,
  multiToken: _MultiToken,
  amountUSD: BigDecimal,
  valueOutQuote: BigInt
): void {
  const logIndexI32 = event.logIndex.toI32();
  const transactionHash = event.transaction.hash.toHexString();
  const swap = new Swap(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  // update swap event
  swap.hash = transactionHash;
  swap.logIndex = logIndexI32;
  swap.protocol = protocol.id;
  swap.to = sender.toHexString();
  swap.from = swap.to;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokensIn = tokensInCollection.ids;
  swap.amountsIn = tokensInCollection.amounts;
  swap.amountsInUSD = tokensInCollection.amountsUSD;
  swap.tokensOut = tokensOutCollection.ids;
  swap.amountsOut = tokensOutCollection.amounts;
  swap.amountsOutUSD = tokensOutCollection.amountsUSD;
  swap._amountUSD = amountUSD;
  swap._multiToken = multiToken.id;
  swap._valueOutQuote = valueOutQuote;
  swap._gasUsed = event.receipt === null ? null : event.receipt!.gasUsed;

  swap.save();
}
