import {
  Address,
  ByteArray,
  crypto,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

///////////////////////////////
///// Etherlink Addresses /////
///////////////////////////////

export const USDC_TOKEN_ADDRESS = "0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Superlend";
  export const NAME = "Superlend v3";
  export const SLUG = "superlend-v3";
}

export const AAVE_DECIMALS = 8;

export namespace InterestRateMode {
  export const NONE = 0 as i32;
  export const STABLE = 1 as i32;
  export const VARIABLE = 2 as i32;
}

////////////////////////////
///// Network Specific /////
////////////////////////////

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, PoolAddressesProviderRegistry
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.ETHERLINK_MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xa5cf001755d54e5e84a45757e1637f29f0a19f2f"),
      Network.ETHERLINK_MAINNET
    );
  } else {
    log.error("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(Address.fromString(ZERO_ADDRESS), "");
  }
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

// Context keys
export const PROTOCOL_ID_KEY = "protocolId";
export const POOL_ADDRESSES_PROVIDER_ID_KEY = "poolAddressesProviderId";

export const BALANCE_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("BalanceTransfer(address,address,uint256,uint256)")
);
export const BALANCE_TRANSFER_DATA_TYPE = "(uint256,uint256)";
