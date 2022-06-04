// rari fuse v1 constants
import { dataSource } from "@graphprotocol/graph-ts";
import { Network } from "../../src/constants";

/////////////////////////
//// Network Config  ////
/////////////////////////

export class NetworkSpecificConstant {
  fusePoolDirectoryAddress: string;
  ethPriceOracle: string;
  network: string;
  constructor(
    fusePoolDirectoryAddress: string,
    ethPriceOracle: string,
    network: string
  ) {
    this.fusePoolDirectoryAddress = fusePoolDirectoryAddress;
    this.ethPriceOracle = ethPriceOracle;
    this.network = network;
  }
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  let network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      "0x835482fe0532f169024d5e9410199369aad5c77e",
      "0x1887118e49e0f4a78bd71b792a49de03504a764d",
      Network.MAINNET
    );
  } else {
    return new NetworkSpecificConstant(
      "0xc201b8c8dd22c779025e16f1825c90e1e6dd6a08",
      "0xeeA67B2F24aa83ee5D0aFa569E8f45245e2ee803",
      Network.ARBITRUM_ONE
    );
  }
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

////////////////////////////
//// Ethereum Addresses ////
////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";

///////////////////////////
//// Protocol Specific ////
///////////////////////////

export const PROTOCOL_NAME = "Fuse";
export const PROTOCOL_SLUG = "fuse";
export const SUBGRAPH_VERSION = "1.0.10";
export const SCHEMA_VERSION = "1.2.1";
export const METHODOLOGY_VERSION = "1.0.0";
