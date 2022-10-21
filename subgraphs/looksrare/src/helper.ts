import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const PROTOCOL_SCHEMA_VERSION = "1.0.0";

export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
  export const CRONOS = "CRONOS"; // Crypto.com Cronos chain
}

export namespace NftStandard {
  export const ERC721 = "ERC721";
  export const ERC1155 = "ERC1155";
  export const UNKNOWN = "UNKNOWN";
}

export namespace SaleStrategy {
  export const STANDARD_SALE = "STANDARD_SALE";
  export const ANY_ITEM_FROM_COLLECTION = "ANY_ITEM_FROM_COLLECTION";
  export const ANY_ITEM_FROM_SET = "ANY_ITEM_FROM_SET";
  export const DUTCH_AUCTION = "DUTCH_AUCTION";
  export const PRIVATE_SALE = "PRIVATE_SALE";
}

export const BIGINT_ZERO = BigInt.zero();
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const MANTISSA_FACTOR = BigInt.fromI32(10)
  .pow(18 as u8)
  .toBigDecimal();
export const SECONDS_PER_DAY = 24 * 60 * 60;

export const WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);
export const STRATEGY_STANDARD_SALE_ADDRESS = Address.fromString(
  "0x56244bb70cbd3ea9dc8007399f61dfc065190031"
);
export const STRATEGY_ANY_ITEM_FROM_COLLECTION_ADDRESS = Address.fromString(
  "0x86f909f70813cdb1bc733f4d97dc6b03b8e7e8f3"
);
export const STRATEGY_PRIVATE_SALE_ADDRESS = Address.fromString(
  "0x58d83536d3efedb9f7f2a1ec3bdaad2b1a4dd98c"
);

export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd";
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26";

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}
