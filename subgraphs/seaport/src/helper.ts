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

// Constants ported from Seaport contracts
// See https://github.com/ProjectOpenSea/seaport/blob/main/contracts/lib/ConsiderationEnums.sol#L116
export namespace SeaportItemType {
  export const NATIVE = 0;
  export const ERC20 = 1;
  export const ERC721 = 2;
  export const ERC1155 = 3;
  export const ERC721_WITH_CRITERIA = 4;
  export const ERC1155_WITH_CRITERIA = 5;
}

export const BIGINT_ZERO = BigInt.zero();
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const MANTISSA_FACTOR = BigInt.fromI32(10)
  .pow(18 as u8)
  .toBigDecimal();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const SECONDS_PER_DAY = 24 * 60 * 60;

export const EXCHANGE_ADDRESS = Address.fromString(
  "0x00000000006c3852cbef3e08e8df289169ede581"
);
export const WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);
export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd";
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26";

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}

export function isMoney(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.NATIVE || itemType == SeaportItemType.ERC20
  );
}

export function isNFT(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC721 ||
    itemType == SeaportItemType.ERC1155 ||
    itemType == SeaportItemType.ERC721_WITH_CRITERIA ||
    itemType == SeaportItemType.ERC1155_WITH_CRITERIA
  );
}

export function isERC721(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC721 ||
    itemType == SeaportItemType.ERC721_WITH_CRITERIA
  );
}

export function isERC1155(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC1155 ||
    itemType == SeaportItemType.ERC1155_WITH_CRITERIA
  );
}

export function isOpenSeaFeeAccount(address: Address): boolean {
  const OPENSEA_WALLET_ADDRESS = Address.fromString(
    "0x5b3256965e7c3cf26e11fcaf296dfc8807c01073"
  );
  const OPENSEA_FEES_ACCOUNT = Address.fromString(
    "0x8de9c5a032463c561423387a9648c5c7bcc5bc90"
  );
  // This can be found https://github.com/web3w/seaport-js/blob/399fa568c04749fd8f96829fa7a6b73d1e440458/src/contracts/index.ts#L30
  const OPENSEA_ETHEREUM_FEE_COLLECTOR = Address.fromString(
    "0x0000a26b00c1F0DF003000390027140000fAa719"
  );
  return (
    address == OPENSEA_WALLET_ADDRESS ||
    address == OPENSEA_FEES_ACCOUNT ||
    address == OPENSEA_ETHEREUM_FEE_COLLECTOR
  );
}
