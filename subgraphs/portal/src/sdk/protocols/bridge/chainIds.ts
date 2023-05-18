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
setChainID(1, Network.SOLANA);
setChainID(2, Network.MAINNET);
setChainID(3, Network.TERRA);
setChainID(4, Network.BSC);
setChainID(5, Network.MATIC);
setChainID(6, Network.AVALANCHE);
setChainID(7, Network.OASIS);
setChainID(9, Network.AURORA);
setChainID(10, Network.FANTOM);
setChainID(11, Network.KARURA);
setChainID(12, Network.ACALA);
setChainID(13, Network.KLAYTN);
setChainID(14, Network.CELO);
setChainID(15, Network.NEAR);
setChainID(16, Network.MOONBEAM);
setChainID(18, Network.TERRA);
setChainID(22, Network.APTOS);
setChainID(23, Network.ARBITRUM_ONE);
