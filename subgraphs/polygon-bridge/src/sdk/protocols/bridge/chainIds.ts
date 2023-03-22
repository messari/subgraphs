import { BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Network } from "../../util/constants";

export function chainIDToNetwork(chainID: BigInt): Network {
  const network = chainIDs.get(chainID.toU64());
  if (network) {
    return network;
  }

  return Network.UNKNOWN_NETWORK;
}

export function networkToChainID(network: Network): BigInt {
  const chainID = reverseChainIDs.get(network);
  if (chainID) {
    return chainID;
  }
  return BigInt.fromI32(-1);
}

function setChainID(chainID: u64, network: Network): void {
  chainIDs.set(chainID, network);
  reverseChainIDs.set(network, BigInt.fromU64(chainID));
}

export const chainIDs = new TypedMap<u64, Network>();
export const reverseChainIDs = new TypedMap<Network, BigInt>();

setChainID(1, Network.MAINNET);
setChainID(137, Network.MATIC);
