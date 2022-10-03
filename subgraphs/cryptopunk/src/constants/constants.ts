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
export namespace AccountType {
  export const MARKETPLACE_ACCOUNT = "MARKETPLACE_ACCOUNT";
  export const COLLECTION_ACCOUNT = "COLLECTION_ACCOUNT";
  export const DAILY_MARKETPLACE_ACCOUNT = "DAILY_MARKETPLACE_ACCOUNT";
  export const DAILY_COLLECTION_ACCOUNT = "DAILY_COLLECTION_ACCOUNT";
}

export namespace TradeType {
  export const BUYER = "Buyer";
  export const SELLER = "Seller";
}
export const CRYPTOPUNK_CONTRACT_ADDRESS =
  "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193bbb";

export const MARKETPLACE_NAME = "LARVALABS";
export const MARKETPLACE_SLUG = "larvalabs";

export const CRYPTOPUNK_NAME = "CRYPTOPUNKS";

export const CRYPTOPUNK_SYMBOL = "Ͼ";
export const CRYPTOPUNK_TOTAL_SUPPLY = BigInt.fromString("10000");

export const NULL_ADDRESS = Address.zero();

export const BIGINT_ZERO = BigInt.zero();
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const ETH_DECIMALS = BigDecimal.fromString("1000000000000000000");
export const SECONDS_PER_DAY = 24 * 60 * 60;
