import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Collection,
  CollectionDailySnapshot,
  Marketplace,
  MarketplaceDailySnapshot,
  Trade,
  _User,
  _Bid,
} from "../../generated/schema";
import { Versions } from "../versions";
import * as constants from "./constants";

export function getOrCreateMarketplace(): Marketplace {
  let marketplace = Marketplace.load(constants.CRYPTOPUNK_CONTRACT_ADDRESS);
  if (!marketplace) {
    marketplace = new Marketplace(constants.CRYPTOPUNK_CONTRACT_ADDRESS);
    marketplace.name = constants.MARKETPLACE_NAME;
    marketplace.slug = constants.MARKETPLACE_SLUG;
    marketplace.network = constants.Network.MAINNET;
    marketplace.collectionCount = 1;
    marketplace.tradeCount = 0;
    marketplace.cumulativeTradeVolumeETH = constants.BIGDECIMAL_ZERO;
    marketplace.marketplaceRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplace.creatorRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplace.totalRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplace.cumulativeUniqueTraders = 0;
  }

  marketplace.schemaVersion = Versions.getSchemaVersion();
  marketplace.subgraphVersion = Versions.getSubgraphVersion();
  marketplace.methodologyVersion = Versions.getMethodologyVersion();

  marketplace.save();

  return marketplace;
}

export function getOrCreateCollection(): Collection {
  let collection = Collection.load(constants.CRYPTOPUNK_CONTRACT_ADDRESS);
  if (!collection) {
    collection = new Collection(constants.CRYPTOPUNK_CONTRACT_ADDRESS);
    collection.name = constants.CRYPTOPUNK_NAME;
    collection.symbol = constants.CRYPTOPUNK_SYMBOL;
    collection.totalSupply = constants.CRYPTOPUNK_TOTAL_SUPPLY;
    collection.nftStandard = constants.NftStandard.UNKNOWN;
    collection.royaltyFee = constants.BIGDECIMAL_ZERO;
    collection.cumulativeTradeVolumeETH = constants.BIGDECIMAL_ZERO;
    collection.marketplaceRevenueETH = constants.BIGDECIMAL_ZERO;
    collection.creatorRevenueETH = constants.BIGDECIMAL_ZERO;
    collection.totalRevenueETH = constants.BIGDECIMAL_ZERO;

    collection.tradeCount = 0;
    collection.buyerCount = 0;
    collection.sellerCount = 0;

    collection.save();
  }

  return collection;
}

export function getOrCreateTrade(
  transactionHash: string,
  logIndex: BigInt
): Trade {
  const id = transactionHash.concat("-").concat(logIndex.toString());
  let trade = Trade.load(id);
  if (!trade) {
    trade = new Trade(id);
    trade.transactionHash = transactionHash;
    trade.logIndex = logIndex.toI32();
    trade.timestamp = constants.BIGINT_ZERO;
    trade.blockNumber = constants.BIGINT_ZERO;
    trade.isBundle = false;
    trade.collection = constants.CRYPTOPUNK_CONTRACT_ADDRESS;
    trade.tokenId = constants.BIGINT_ZERO;
    trade.amount = constants.BIGINT_ZERO;
    trade.priceETH = constants.BIGDECIMAL_ZERO;
    trade.strategy = "";
    trade.buyer = "";
    trade.seller = "";
    trade.save();
  }
  return trade;
}

export function getOrCreateMarketplaceDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt
): MarketplaceDailySnapshot {
  const noOfDaysSinceUnix = (
    timestamp.toI32() / constants.SECONDS_PER_DAY
  ).toString();
  const snapshotID =
    constants.CRYPTOPUNK_CONTRACT_ADDRESS.concat("-").concat(noOfDaysSinceUnix);
  let marketplaceDailySnapshot = MarketplaceDailySnapshot.load(snapshotID);
  if (!marketplaceDailySnapshot) {
    marketplaceDailySnapshot = new MarketplaceDailySnapshot(snapshotID);

    const marketplace = getOrCreateMarketplace();
    marketplaceDailySnapshot.marketplace =
      constants.CRYPTOPUNK_CONTRACT_ADDRESS;

    marketplaceDailySnapshot.totalRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplaceDailySnapshot.creatorRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplaceDailySnapshot.marketplaceRevenueETH = constants.BIGDECIMAL_ZERO;
    marketplaceDailySnapshot.cumulativeTradeVolumeETH =
      marketplace.cumulativeTradeVolumeETH;

    marketplaceDailySnapshot.collectionCount = 1;
    marketplaceDailySnapshot.dailyTradedCollectionCount = 0;

    marketplaceDailySnapshot.tradeCount = marketplace.tradeCount;
    marketplaceDailySnapshot.dailyTradedItemCount = 0;

    marketplaceDailySnapshot.cumulativeUniqueTraders =
      marketplace.cumulativeUniqueTraders;
    marketplaceDailySnapshot.dailyActiveTraders = 0;

    marketplaceDailySnapshot.blockNumber = blockNumber;
    marketplaceDailySnapshot.timestamp = timestamp;

    marketplaceDailySnapshot.save();
  }

  return marketplaceDailySnapshot;
}

export function getOrCreateCollectionDailySnapshot(
  block: ethereum.Block
): CollectionDailySnapshot {
  const noOfDaysSinceUnix = (
    block.timestamp.toI32() / constants.SECONDS_PER_DAY
  ).toString();
  const snapshotID =
    constants.CRYPTOPUNK_CONTRACT_ADDRESS.concat("-").concat(noOfDaysSinceUnix);
  let collectionDailySnapshot = CollectionDailySnapshot.load(snapshotID);
  if (!collectionDailySnapshot) {
    collectionDailySnapshot = new CollectionDailySnapshot(snapshotID);

    const collection = getOrCreateCollection();

    collectionDailySnapshot.collection = constants.CRYPTOPUNK_CONTRACT_ADDRESS;

    collectionDailySnapshot.totalRevenueETH = constants.BIGDECIMAL_ZERO;
    collectionDailySnapshot.dailyTradeVolumeETH = constants.BIGDECIMAL_ZERO;
    collectionDailySnapshot.creatorRevenueETH = constants.BIGDECIMAL_ZERO;
    collectionDailySnapshot.marketplaceRevenueETH = constants.BIGDECIMAL_ZERO;
    collectionDailySnapshot.cumulativeTradeVolumeETH =
      collection.cumulativeTradeVolumeETH;

    collectionDailySnapshot.royaltyFee = constants.BIGDECIMAL_ZERO;

    collectionDailySnapshot.dailyMinSalePrice = constants.BIGDECIMAL_MAX;
    collectionDailySnapshot.dailyMaxSalePrice = constants.BIGDECIMAL_ZERO;

    collectionDailySnapshot.tradeCount = collection.tradeCount;
    collectionDailySnapshot.dailyTradedItemCount = 0;

    collectionDailySnapshot.timestamp = block.timestamp;
    collectionDailySnapshot.blockNumber = block.timestamp;

    collectionDailySnapshot.save();
  }
  return collectionDailySnapshot;
}

export function createBid(
  tokenId: BigInt,
  bidAmount: BigInt,
  bidderAddress: Address,
  block: ethereum.Block
): _Bid {
  const bidId = tokenId
    .toString()
    .concat("-")
    .concat(bidderAddress.toHexString());
  let bid = _Bid.load(bidId);

  if (!bid) {
    bid = new _Bid(bidId);
    bid.tokensBid = bidAmount;
    bid.tokenId = tokenId;
    bid.blockNumber = block.number;
    bid.timestamp = block.timestamp;
    bid.bidder = bidderAddress.toHexString();
    bid.save();
  }
  return bid;
}
export function createUserCollectionAccount(
  type: string,
  address: Address
): void {
  const collection = getOrCreateCollection();

  if (type === constants.TradeType.BUYER) {
    let buyerCollection = _User.load(
      constants.AccountType.COLLECTION_ACCOUNT.concat("-")
        .concat(constants.TradeType.BUYER)
        .concat("-")
        .concat(address.toHexString())
    );

    if (!buyerCollection) {
      buyerCollection = new _User(
        constants.AccountType.COLLECTION_ACCOUNT.concat("-")
          .concat(constants.TradeType.BUYER)
          .concat("-")
          .concat(address.toHexString())
      );

      collection.buyerCount += 1;
    }
    collection.save();
  }
  if (type === constants.TradeType.SELLER) {
    const collection = getOrCreateCollection();

    let sellerCollection = _User.load(
      constants.AccountType.COLLECTION_ACCOUNT.concat("-")
        .concat(constants.TradeType.SELLER)
        .concat("-")
        .concat(address.toHexString())
    );

    if (!sellerCollection) {
      sellerCollection = new _User(
        constants.AccountType.COLLECTION_ACCOUNT.concat("-")
          .concat(constants.TradeType.SELLER)
          .concat("-")
          .concat(address.toHexString())
      );

      collection.sellerCount += 1;
    }
    collection.save();
  }
}

export function createUserMarketplaceAccount(
  address: Address,
  block: ethereum.Block
): void {
  let marketplaceUser = _User.load(
    constants.AccountType.MARKETPLACE_ACCOUNT.concat("-").concat(
      address.toHexString()
    )
  );

  if (!marketplaceUser) {
    const marketplace = getOrCreateMarketplace();
    const marketplaceDailySnapshot = getOrCreateMarketplaceDailySnapshot(
      block.timestamp,
      block.number
    );

    marketplaceUser = new _User(
      constants.AccountType.MARKETPLACE_ACCOUNT.concat("-").concat(
        address.toHexString()
      )
    );
    marketplace.cumulativeUniqueTraders += 1;
    marketplaceDailySnapshot.cumulativeUniqueTraders += 1;
    marketplaceDailySnapshot.save();
    marketplace.save();
  }
}
