import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

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

export const NULL_ADDRESS = Address.zero();
export const WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);

export const WYVERN_ATOMICIZER_ADDRESS = Address.fromString(
  "0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5"
);
export const EXCHANGE_MARKETPLACE_ADDRESS = Address.fromString(
  "0x7f268357A8c2552623316e2562D90e642bB538E5"
);
export const EXCHANGE_MARKETPLACE_NAME = "OpenSea Wyvern Exchange v2";
export const EXCHANGE_MARKETPLACE_SLUG = "opensea-v2";
export const EXCHANGE_MARKETPLACE_FEE = BigInt.fromI32(250);

// Function Selectors for ERC721/1155 Transfer Methods
// 0x23b872dd	transferFrom(address,address,uint256)
// 0x42842e0e	safeTransferFrom(address,address,uint256)
// 0xf242432a safeTransferFrom(address,address,uint256,uint256,bytes)
export const TRANSFER_FROM_SELECTOR = "0x23b872dd";
export const ERC721_SAFE_TRANSFER_FROM_SELECTOR = "0x42842e0e";
export const ERC1155_SAFE_TRANSFER_FROM_SELECTOR = "0xf242432a";

// Function Selectors for MerkleValidator Methods (0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7)
// 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
// 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
// 0x96809f90 matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
export const MATCH_ERC721_TRANSFER_FROM_SELCTOR = "0xfb16a595";
export const MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR = "0xc5a0236e";
export const MATCH_ERC115_SAFE_TRANSFER_FROM_SELCTOR = "0x96809f90";

export const ETHABI_DECODE_PREFIX = Bytes.fromHexString(
  "0000000000000000000000000000000000000000000000000000000000000020"
);

export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd";
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26";

export const MANTISSA_FACTOR = BigInt.fromI32(10).pow(18).toBigDecimal();
export const INVERSE_BASIS_POINT = BigDecimal.fromString("10000");

export const BIGINT_ZERO = BigInt.zero();
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();

export const SECONDS_PER_DAY = 24 * 60 * 60;
