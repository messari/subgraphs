/* eslint-disable @typescript-eslint/no-magic-numbers */
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
setChainID(8, Network.UBIQ);
setChainID(10, Network.OPTIMISM);
setChainID(19, Network.SONGBIRD);
setChainID(20, Network.ELASTOS);
setChainID(24, Network.KARDIACHAIN);
setChainID(25, Network.CRONOS);
setChainID(30, Network.RSK);
setChainID(40, Network.TELOS);
setChainID(50, Network.XDC);
setChainID(52, Network.CSC);
setChainID(55, Network.ZYX);
setChainID(56, Network.BSC);
setChainID(57, Network.SYSCOIN);
setChainID(60, Network.GOCHAIN);
setChainID(61, Network.ETHEREUMCLASSIC);
setChainID(66, Network.OKEXCHAIN);
setChainID(70, Network.HOO);
setChainID(82, Network.METER);
setChainID(87, Network.NOVA_NETWORK);
setChainID(88, Network.TOMOCHAIN);
setChainID(100, Network.XDAI);
setChainID(106, Network.VELAS);
setChainID(108, Network.THUNDERCORE);
setChainID(122, Network.FUSE);
setChainID(128, Network.HECO);
setChainID(137, Network.MATIC);
setChainID(200, Network.XDAIARB);
setChainID(246, Network.ENERGYWEB);
setChainID(250, Network.FANTOM);
setChainID(269, Network.HPB);
setChainID(288, Network.BOBA);
setChainID(321, Network.KUCOIN);
setChainID(336, Network.SHIDEN);
setChainID(361, Network.THETA);
setChainID(416, Network.SX);
setChainID(534, Network.CANDLE);
setChainID(592, Network.ASTAR);
setChainID(820, Network.CALLISTO);
setChainID(888, Network.WANCHAIN);
setChainID(1088, Network.METIS);
setChainID(1231, Network.ULTRON);
setChainID(1234, Network.STEP);
setChainID(1284, Network.MOONBEAM);
setChainID(1285, Network.MOONRIVER);
setChainID(2000, Network.DOGECHAIN);
setChainID(2020, Network.RONIN);
setChainID(2222, Network.KAVA);
setChainID(4689, Network.IOTEX);
setChainID(5050, Network.XLC);
setChainID(5551, Network.NAHMII);
setChainID(6969, Network.TOMBCHAIN);
setChainID(7700, Network.CANTO);
setChainID(8217, Network.KLAYTN);
setChainID(9001, Network.EVMOS);
setChainID(10000, Network.SMARTBCH);
setChainID(32520, Network.BITGERT);
setChainID(32659, Network.FUSION);
setChainID(39815, Network.OHO);
setChainID(42161, Network.ARBITRUM_ONE);
setChainID(42170, Network.ARB_NOVA);
setChainID(42220, Network.CELO);
setChainID(42262, Network.OASIS);
setChainID(43114, Network.AVALANCHE);
setChainID(47805, Network.REI);
setChainID(55555, Network.REICHAIN);
setChainID(71402, Network.GODWOKEN);
setChainID(333999, Network.POLIS);
setChainID(420420, Network.KEKCHAIN);
setChainID(888888, Network.VISION);
setChainID(1313161554, Network.AURORA);
setChainID(1666600000, Network.HARMONY);
setChainID(11297108109, Network.PALM);
setChainID(836542336838601, Network.CURIO);
