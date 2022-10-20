import { ethereum, log, Bytes, BigInt, Address } from "@graphprotocol/graph-ts";
import { EvInventory } from "../generated/X2Y2Exchange/X2Y2Exchange";
import {
  Collection,
  CollectionDailySnapshot,
  Marketplace,
  MarketplaceDailySnapshot,
  Trade,
  _Item,
} from "../generated/schema";
import { NftMetadata } from "../generated/X2Y2Exchange/NftMetadata";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_MAX,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FEE_PERCENTAGE_FACTOR,
  MANTISSA_FACTOR,
  max,
  min,
  NftStandard,
  PROTOCOL_FEE_MANAGER,
  SaleStrategy,
  SECONDS_PER_DAY,
  X2Y2Op,
} from "./helper";
import { NetworkConfigs } from "../configurations/configure";

class Token {
  constructor(
    public readonly address: Address,
    public readonly tokenId: BigInt
  ) {}
}

export function handleEvInventory(event: EvInventory): void {
  let tokens = decodeTokens(event.params.item.data);
  let collectionAddr = tokens[0].address.toHexString();
  let collection = getOrCreateCollection(collectionAddr);
  let isBundle = tokens.length > 1;
  let volumeETH = event.params.item.price.toBigDecimal().div(MANTISSA_FACTOR);
  let priceETH = volumeETH.div(BigInt.fromI32(tokens.length).toBigDecimal());
  // TODO: private sale is also possible but yet to figured out how to tell if an event is from a private sale
  let strategy = SaleStrategy.STANDARD_SALE;
  let buyer =
    event.params.detail.op == X2Y2Op.COMPLETE_BUY_OFFER
      ? event.params.maker.toHexString()
      : event.params.taker.toHexString();
  let seller =
    event.params.detail.op == X2Y2Op.COMPLETE_BUY_OFFER
      ? event.params.taker.toHexString()
      : event.params.maker.toHexString();

  //
  // new trade
  //
  for (let i = 0; i < tokens.length; i++) {
    let tradeID = isBundle
      ? event.transaction.hash
          .toHexString()
          .concat("-")
          .concat(event.logIndex.toString())
          .concat("-")
          .concat(i.toString())
      : event.transaction.hash
          .toHexString()
          .concat("-")
          .concat(event.logIndex.toString());

    let trade = new Trade(tradeID);
    trade.transactionHash = event.transaction.hash.toHexString();
    trade.logIndex = event.logIndex.toI32();
    trade.timestamp = event.block.timestamp;
    trade.blockNumber = event.block.number;
    trade.isBundle = isBundle;
    trade.collection = collectionAddr;
    trade.tokenId = tokens[i].tokenId;
    // average price within the bundle
    trade.priceETH = priceETH;
    // amount is set 1 because x2y2 only supports erc721 as of now
    trade.amount = BigInt.fromI32(1);
    trade.strategy = strategy;
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();
  }

  //
  // calculate marketplace vs creator revenue allocation
  //
  let marketplaceRevenuePercentage = BIGINT_ZERO;
  let creatorRevenuePercentage = BIGINT_ZERO;
  let fees = event.params.detail.fees;
  for (let i = 0; i < fees.length; i++) {
    let fee = fees[i];
    if (fee.to == PROTOCOL_FEE_MANAGER) {
      marketplaceRevenuePercentage = marketplaceRevenuePercentage.plus(
        fee.percentage
      );
    } else {
      creatorRevenuePercentage = creatorRevenuePercentage.plus(fee.percentage);
    }
  }

  //
  // update collection
  //
  collection.tradeCount += tokens.length;
  collection.royaltyFee = creatorRevenuePercentage
    .toBigDecimal()
    .div(FEE_PERCENTAGE_FACTOR)
    .times(BIGDECIMAL_HUNDRED);
  let buyerCollectionAccountID = "COLLECTION_ACCOUNT-BUYER-"
    .concat(collection.id)
    .concat("-")
    .concat(buyer);
  let buyerCollectionAccount = _Item.load(buyerCollectionAccountID);
  if (!buyerCollectionAccount) {
    buyerCollectionAccount = new _Item(buyerCollectionAccountID);
    buyerCollectionAccount.save();
    collection.buyerCount += 1;
  }
  let sellerCollectionAccountID = "COLLECTION_ACCOUNT-SELLER-"
    .concat(collection.id)
    .concat("-")
    .concat(seller);
  let sellerCollectionAccount = _Item.load(sellerCollectionAccountID);
  if (!sellerCollectionAccount) {
    sellerCollectionAccount = new _Item(sellerCollectionAccountID);
    sellerCollectionAccount.save();
    collection.sellerCount += 1;
  }
  collection.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH.plus(volumeETH);
  let deltaMarketplaceRevenueETH = volumeETH.times(
    marketplaceRevenuePercentage.toBigDecimal().div(FEE_PERCENTAGE_FACTOR)
  );
  let deltaCreatorRevenueETH = volumeETH.times(
    creatorRevenuePercentage.toBigDecimal().div(FEE_PERCENTAGE_FACTOR)
  );
  collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
    deltaMarketplaceRevenueETH
  );
  collection.creatorRevenueETH = collection.creatorRevenueETH.plus(
    deltaCreatorRevenueETH
  );
  collection.totalRevenueETH = collection.marketplaceRevenueETH.plus(
    collection.creatorRevenueETH
  );
  collection.save();

  //
  // update marketplace
  //
  let marketplace = getOrCreateMarketplace(
    NetworkConfigs.getMarketplaceAddress()
  );
  marketplace.tradeCount += 1;
  marketplace.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH.plus(volumeETH);
  marketplace.marketplaceRevenueETH = marketplace.marketplaceRevenueETH.plus(
    deltaMarketplaceRevenueETH
  );
  marketplace.creatorRevenueETH = marketplace.creatorRevenueETH.plus(
    deltaCreatorRevenueETH
  );
  marketplace.totalRevenueETH = marketplace.marketplaceRevenueETH.plus(
    marketplace.creatorRevenueETH
  );
  let buyerAccountID = "MARKETPLACE_ACCOUNT-".concat(buyer);
  let buyerAccount = _Item.load(buyerAccountID);
  if (!buyerAccount) {
    buyerAccount = new _Item(buyerAccountID);
    buyerAccount.save();
    marketplace.cumulativeUniqueTraders += 1;
  }
  let sellerAccountID = "MARKETPLACE_ACCOUNT-".concat(seller);
  let sellerAccount = _Item.load(sellerAccountID);
  if (!sellerAccount) {
    sellerAccount = new _Item(sellerAccountID);
    sellerAccount.save();
    marketplace.cumulativeUniqueTraders += 1;
  }
  marketplace.save();

  // prepare for updating dailyTradedItemCount
  let newDailyTradedItem = 0;
  for (let i = 0; i < tokens.length; i++) {
    let dailyTradedItemID = "DAILY_TRADED_ITEM-"
      .concat(collectionAddr)
      .concat("-")
      .concat(tokens[i].tokenId.toString())
      .concat("-")
      .concat((event.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
    let dailyTradedItem = _Item.load(dailyTradedItemID);
    if (!dailyTradedItem) {
      dailyTradedItem = new _Item(dailyTradedItemID);
      dailyTradedItem.save();
      newDailyTradedItem++;
    }
  }
  //
  // take collection snapshot
  //
  let collectionSnapshot = getOrCreateCollectionDailySnapshot(
    collectionAddr,
    event.block.timestamp
  );
  collectionSnapshot.blockNumber = event.block.number;
  collectionSnapshot.timestamp = event.block.timestamp;
  collectionSnapshot.royaltyFee = collection.royaltyFee;
  collectionSnapshot.dailyMinSalePrice = min(
    collectionSnapshot.dailyMinSalePrice,
    priceETH
  );
  collectionSnapshot.dailyMaxSalePrice = max(
    collectionSnapshot.dailyMaxSalePrice,
    priceETH
  );
  collectionSnapshot.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH;
  collectionSnapshot.marketplaceRevenueETH = collection.marketplaceRevenueETH;
  collectionSnapshot.creatorRevenueETH = collection.creatorRevenueETH;
  collectionSnapshot.totalRevenueETH = collection.totalRevenueETH;
  collectionSnapshot.tradeCount = collection.tradeCount;
  collectionSnapshot.dailyTradeVolumeETH =
    collectionSnapshot.dailyTradeVolumeETH.plus(volumeETH);
  collectionSnapshot.dailyTradedItemCount += newDailyTradedItem;
  collectionSnapshot.save();

  //
  // take marketplace snapshot
  //
  let marketplaceSnapshot = getOrCreateMarketplaceDailySnapshot(
    event.block.timestamp
  );
  marketplaceSnapshot.blockNumber = event.block.number;
  marketplaceSnapshot.timestamp = event.block.timestamp;
  marketplaceSnapshot.collectionCount = marketplace.collectionCount;
  marketplaceSnapshot.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH;
  marketplaceSnapshot.marketplaceRevenueETH = marketplace.marketplaceRevenueETH;
  marketplaceSnapshot.creatorRevenueETH = marketplace.creatorRevenueETH;
  marketplaceSnapshot.totalRevenueETH = marketplace.totalRevenueETH;
  marketplaceSnapshot.tradeCount = marketplace.tradeCount;
  marketplaceSnapshot.cumulativeUniqueTraders =
    marketplace.cumulativeUniqueTraders;
  let dailyBuyerID = "DAILY_MARKERPLACE_ACCOUNT-".concat(buyer);
  let dailyBuyer = _Item.load(dailyBuyerID);
  if (!dailyBuyer) {
    dailyBuyer = new _Item(dailyBuyerID);
    dailyBuyer.save();
    marketplaceSnapshot.dailyActiveTraders += 1;
  }
  let dailySellerID = "DAILY_MARKETPLACE_ACCOUNT-".concat(seller);
  let dailySeller = _Item.load(dailySellerID);
  if (!dailySeller) {
    dailySeller = new _Item(dailySellerID);
    dailySeller.save();
    marketplaceSnapshot.dailyActiveTraders += 1;
  }
  let dailyTradedCollectionID = "DAILY_TRADED_COLLECTION-"
    .concat(collectionAddr)
    .concat("-")
    .concat((event.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
  let dailyTradedCollection = _Item.load(dailyTradedCollectionID);
  if (!dailyTradedCollection) {
    dailyTradedCollection = new _Item(dailyTradedCollectionID);
    dailyTradedCollection.save();
    marketplaceSnapshot.dailyTradedCollectionCount += 1;
  }
  marketplaceSnapshot.dailyTradedItemCount += newDailyTradedItem;
  marketplaceSnapshot.save();
}

function getOrCreateCollection(collectionID: string): Collection {
  let collection = Collection.load(collectionID);
  if (!collection) {
    collection = new Collection(collectionID);
    // only ERC721 is supported atm, but more (such as ERC1155) will come
    collection.nftStandard = NftStandard.ERC721;
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
      NetworkConfigs.getMarketplaceAddress()
    );
    marketplace.collectionCount += 1;
    marketplace.save();
  }
  return collection;
}

function getOrCreateMarketplace(marketplaceID: string): Marketplace {
  let marketplace = Marketplace.load(marketplaceID);
  if (!marketplace) {
    marketplace = new Marketplace(marketplaceID);
    marketplace.name = NetworkConfigs.getProtocolName();
    marketplace.slug = NetworkConfigs.getProtocolSlug();
    marketplace.network = NetworkConfigs.getNetwork();
    marketplace.schemaVersion = NetworkConfigs.getSchemaVersion();
    marketplace.subgraphVersion = NetworkConfigs.getSubgraphVersion();
    marketplace.methodologyVersion = NetworkConfigs.getMethodologyVersion();
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

function getOrCreateCollectionDailySnapshot(
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

function getOrCreateMarketplaceDailySnapshot(
  timestamp: BigInt
): MarketplaceDailySnapshot {
  let snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();
  let snapshot = MarketplaceDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketplaceDailySnapshot(snapshotID);
    snapshot.marketplace = NetworkConfigs.getMarketplaceAddress();
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

/**
 * Same effect as `abi.decode(data, (Pair[]))` but in assemblyscript
 * @param data encoding `struct Pair { IERC721 token; uint256 tokenId; }`
 */
function decodeTokens(data: Bytes): Array<Token> {
  let decoded = ethereum.decode("(address,uint256)[]", data);
  let result: Array<Token> = [];
  if (!decoded) {
    log.warning("failed to decode {}", [data.toHexString()]);
  } else {
    let pairs = decoded.toArray();
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i].toTuple();
      result.push(new Token(pair[0].toAddress(), pair[1].toBigInt()));
    }
  }
  return result;
}
