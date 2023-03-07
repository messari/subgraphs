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
setChainID(101, Network.MAINNET);
setChainID(2, Network.BSC);
setChainID(102, Network.BSC);
setChainID(6, Network.AVALANCHE);
setChainID(106, Network.AVALANCHE);
setChainID(9, Network.MATIC);
setChainID(109, Network.MATIC);
setChainID(10, Network.ARBITRUM_ONE);
setChainID(110, Network.ARBITRUM_ONE);
setChainID(11, Network.OPTIMISM);
setChainID(111, Network.OPTIMISM);
setChainID(12, Network.FANTOM);
setChainID(112, Network.FANTOM);
