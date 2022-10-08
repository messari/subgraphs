import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO, MAX_PPM } from "./constants";
import { getOrCreateIndexer } from "./getters";

export function getDelegatorCut(
  event: ethereum.Event,
  indexerAddress: Address,
  amount: BigInt
): BigInt {
  return amount.minus(getIndexerCut(event, indexerAddress, amount));
}

export function getIndexerCut(
  event: ethereum.Event,
  indexerAddress: Address,
  amount: BigInt
): BigInt {
  const indexer = getOrCreateIndexer(event, indexerAddress);
  if (indexer.delegatedTokens != BIGINT_ZERO) {
    return indexer.indexingRewardCut.times(amount).div(MAX_PPM);
  } else {
    return amount;
  }
}
