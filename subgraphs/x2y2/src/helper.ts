import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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

// Constants ported from X2Y2 contracts
// See https://github.com/0xbe1/x2y2-contracts/blob/master/contracts/MarketConsts.sol#L92
export namespace X2Y2Op {
  export const COMPLETE_SELL_OFFER = 1;
  export const COMPLETE_BUY_OFFER = 2;
}

export const BIGINT_ZERO = BigInt.zero();
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const MANTISSA_FACTOR = BigInt.fromI32(10)
  .pow(18 as u8)
  .toBigDecimal();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
// EvInventory.detail.fees returns Fee[], Fee.percentage 5000 represents 0.5%, and the factor is 1e6
export const FEE_PERCENTAGE_FACTOR = BigInt.fromI32(1_000_000).toBigDecimal();
export const SECONDS_PER_DAY = 24 * 60 * 60;

export const PROTOCOL_FEE_MANAGER = Address.fromString(
  "0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd"
);

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}
