import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { ERC165 } from "../generated/OpenSeaV2/ERC165";
import { NftMetadata } from "../generated/OpenSeaV2/NftMetadata";
import {
  Collection,
  CollectionDailySnapshot,
  Marketplace,
  MarketplaceDailySnapshot,
} from "../generated/schema";
import {
  Network,
  EXCHANGE_MARKETPLACE_NAME,
  BIGDECIMAL_ZERO,
  EXCHANGE_MARKETPLACE_SLUG,
  EXCHANGE_MARKETPLACE_ADDRESS,
  NULL_ADDRESS,
  WETH_ADDRESS,
  MANTISSA_FACTOR,
  BIGINT_ZERO,
  SECONDS_PER_DAY,
  BIGDECIMAL_MAX,
  SaleStrategy,
  ERC721_INTERFACE_IDENTIFIER,
  ERC1155_INTERFACE_IDENTIFIER,
  NftStandard,
} from "./constants";

export function getOrCreateMarketplace(marketplaceID: string): Marketplace {
  let marketplace = Marketplace.load(marketplaceID);
  if (!marketplace) {
    marketplace = new Marketplace(marketplaceID);
    marketplace.name = EXCHANGE_MARKETPLACE_NAME;
    marketplace.slug = EXCHANGE_MARKETPLACE_SLUG;
    marketplace.network = Network.MAINNET;
    marketplace.schemaVersion = "1.0.0";
    marketplace.subgraphVersion = "1.0.0";
    marketplace.methodologyVersion = "1.0.0";
    marketplace.collectionCount = 0;
    marketplace.tradeCount = 0;
    marketplace.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    marketplace.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    marketplace.creatorRevenueETH = BIGDECIMAL_ZERO;
    marketplace.totalRevenueETH = BIGDECIMAL_ZERO;
    marketplace.cumulativeUniqueTraders = 0;

    marketplace.save();
  }

  return marketplace;
}

export function getOrCreateCollection(collectionID: string): Collection {
  let collection = Collection.load(collectionID);
  if (!collection) {
    collection = new Collection(collectionID);

    collection.nftStandard = getNftStandard(collectionID);
    let contract = NftMetadata.bind(Address.fromString(collectionID));

    let nameResult = contract.try_name();
    if (!nameResult.reverted) {
      collection.name = nameResult.value;
    }
    let symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      collection.symbol = symbolResult.value;
    }
    let totalSupplyResult = contract.try_totalSupply();
    if (!totalSupplyResult.reverted) {
      collection.totalSupply = totalSupplyResult.value;
    }

    collection.royaltyFee = BIGDECIMAL_ZERO;
    collection.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    collection.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    collection.creatorRevenueETH = BIGDECIMAL_ZERO;
    collection.totalRevenueETH = BIGDECIMAL_ZERO;
    collection.tradeCount = 0;
    collection.buyerCount = 0;
    collection.sellerCount = 0;

    collection.save();

    let marketplace = getOrCreateMarketplace(
      EXCHANGE_MARKETPLACE_ADDRESS.toHexString()
    );
    marketplace.collectionCount += 1;
    marketplace.save();
  }

  return collection;
}

export function getOrCreateMarketplaceDailySnapshot(
  timestamp: BigInt
): MarketplaceDailySnapshot {
  let snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();

  let snapshot = MarketplaceDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketplaceDailySnapshot(snapshotID);
    snapshot.marketplace = EXCHANGE_MARKETPLACE_ADDRESS.toHexString();
    snapshot.blockNumber = BIGINT_ZERO;
    snapshot.timestamp = BIGINT_ZERO;
    snapshot.collectionCount = 0;
    snapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    snapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
    snapshot.totalRevenueETH = BIGDECIMAL_ZERO;
    snapshot.tradeCount = 0;
    snapshot.cumulativeUniqueTraders = 0;
    snapshot.dailyTradedItemCount = 0;
    snapshot.dailyActiveTraders = 0;
    snapshot.dailyTradedCollectionCount = 0;

    snapshot.save();
  }

  return snapshot;
}

export function getOrCreateCollectionDailySnapshot(
  collection: string,
  timestamp: BigInt
): CollectionDailySnapshot {
  let snapshotID = collection
    .concat("-")
    .concat((timestamp.toI32() / SECONDS_PER_DAY).toString());

  let snapshot = CollectionDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new CollectionDailySnapshot(snapshotID);
    snapshot.collection = collection;
    snapshot.blockNumber = BIGINT_ZERO;
    snapshot.timestamp = BIGINT_ZERO;
    snapshot.royaltyFee = BIGDECIMAL_ZERO;
    snapshot.dailyMinSalePrice = BIGDECIMAL_MAX;
    snapshot.dailyMaxSalePrice = BIGDECIMAL_ZERO;
    snapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.dailyTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    snapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
    snapshot.totalRevenueETH = BIGDECIMAL_ZERO;
    snapshot.tradeCount = 0;
    snapshot.dailyTradedItemCount = 0;

    snapshot.save();
  }

  return snapshot;
}

function getNftStandard(collectionID: string): string {
  let erc165 = ERC165.bind(Address.fromString(collectionID));

  let isERC721Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER)
  );
  if (isERC721Result.reverted) {
    log.warning("[getNftStandard] isERC721 reverted, collection ID: {}", [
      collectionID,
    ]);
  } else {
    if (isERC721Result.value) {
      return NftStandard.ERC721;
    }
  }

  let isERC1155Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER)
  );
  if (isERC1155Result.reverted) {
    log.warning("[getNftStandard] isERC1155 reverted, collection ID: {}", [
      collectionID,
    ]);
  } else {
    if (isERC1155Result.value) {
      return NftStandard.ERC1155;
    }
  }

  return NftStandard.UNKNOWN;
}

export function getSaleStrategy(saleKind: i32): string {
  if (saleKind == 0) {
    return SaleStrategy.STANDARD_SALE;
  } else {
    return SaleStrategy.DUTCH_AUCTION;
  }
}

export function calcTradeVolumeETH(
  paymentToken: Address,
  basePrice: BigInt
): BigDecimal {
  if (paymentToken == NULL_ADDRESS || paymentToken == WETH_ADDRESS) {
    return basePrice.toBigDecimal().div(MANTISSA_FACTOR);
  } else {
    return BIGDECIMAL_ZERO;
  }
}

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}
