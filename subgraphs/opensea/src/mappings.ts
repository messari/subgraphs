import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import { Trade, _Item } from "../generated/schema";
import { NetworkConfigs } from "../configurations/configure";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  EXCHANGE_MARKETPLACE_FEE,
  INVERSE_BASIS_POINT,
  NULL_ADDRESS,
  SaleStrategy,
  SECONDS_PER_DAY,
  WYVERN_ATOMICIZER_ADDRESS,
} from "./constants";
import {
  calcTradePriceETH,
  decodeSingleNftData,
  decodeBundleNftData,
  getOrCreateCollection,
  getOrCreateCollectionDailySnapshot,
  getOrCreateMarketplace,
  getOrCreateMarketplaceDailySnapshot,
} from "./helpers";
import { getSaleStrategy, guardedArrayReplace, min, max } from "./utils";

/**
 * Order struct as found in the Project Wyvern official source
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L92
 */
// struct Order {
//   /* Exchange address, intended as a versioning mechanism. */
//   address exchange;
//   /* Order maker address. */
//   address maker;
//   /* Order taker address, if specified. */
//   address taker;
//   /* Maker relayer fee of the order, unused for taker order. */
//   uint makerRelayerFee;
//   /* Taker relayer fee of the order, or maximum taker fee for a taker order. */
//   uint takerRelayerFee;
//   /* Maker protocol fee of the order, unused for taker order. */
//   uint makerProtocolFee;
//   /* Taker protocol fee of the order, or maximum taker fee for a taker order. */
//   uint takerProtocolFee;
//   /* Order fee recipient or zero address for taker order. */
//   address feeRecipient;
//   /* Fee method (protocol token or split fee). */
//   FeeMethod feeMethod;
//   /* Side (buy/sell). */
//   SaleKindInterface.Side side;
//   /* Kind of sale. */
//   SaleKindInterface.SaleKind saleKind;
//   /* Target. */
//   address target;
//   /* HowToCall. */
//   AuthenticatedProxy.HowToCall howToCall;
//   /* Calldata. */
//   bytes calldata;
//   /* Calldata replacement pattern, or an empty byte array for no replacement. */
//   bytes replacementPattern;
//   /* Static call target, zero-address for no static call. */
//   address staticTarget;
//   /* Static call extra data. */
//   bytes staticExtradata;
//   /* Token used to pay for the order, or the zero-address as a sentinel value for Ether. */
//   address paymentToken;
//   /* Base price of the order (in paymentTokens). */
//   uint basePrice;
//   /* Auction extra parameter - minimum bid increment for English auctions, starting/ending price difference. */
//   uint extra;
//   /* Listing timestamp. */
//   uint listingTime;
//   /* Expiration timestamp - 0 for no expiry. */
//   uint expirationTime;
//   /* Order salt, used to prevent duplicate hashes. */
//   uint salt;
//   /* NOTE: uint nonce is an additional component of the order but is read from storage */
// }

/**
 * atomicMatch method signature as found in the Project Wyvern official source
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L665
 *
 * atomicMatch(Order memory buy, Sig memory buySig, Order memory sell, Sig memory sellSig, bytes32 metadata)
 *
 * atomicMatch parameters matched with labels of call inputs
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/Exchange.sol#L333
 *
 * - buy: Order(addrs[0] exchange, addrs[1] maker, addrs[2] taker, uints[0] makerRelayerFee, uints[1] takerRelayerFee, uints[2] makerProtocolFee, uints[3] takerProtocolFee, addrs[3] feeRecipient, FeeMethod(feeMethodsSidesKindsHowToCalls[0]) feeMethod, SaleKindInterface.Side(feeMethodsSidesKindsHowToCalls[1]) side, SaleKindInterface.SaleKind(feeMethodsSidesKindsHowToCalls[2]) sideKind, addrs[4] target, AuthenticatedProxy.HowToCall(feeMethodsSidesKindsHowToCalls[3]) howToCall, calldataBuy calldata, replacementPatternBuy replacementPattern, addrs[5] staticTarget, staticExtradataBuy staticExtradata, ERC20(addrs[6]) paymentToken, uints[4] basePrice, uints[5] extra, uints[6] listingTime, uints[7] expirationTime, uints[8] salt),
 * - buySig: Sig(vs[0], rssMetadata[0], rssMetadata[1]),
 * - sell: Order(addrs[7] exchange, addrs[8] maker, addrs[9] taker, uints[9] makerRelayerFee, uints[10] takerRelayerFee, uints[11] makerProtocolFee, uints[12] takerProtocolFee, addrs[10] feeRecipient, FeeMethod(feeMethodsSidesKindsHowToCalls[4]) feeMethod, SaleKindInterface.Side(feeMethodsSidesKindsHowToCalls[5]) side, SaleKindInterface.SaleKind(feeMethodsSidesKindsHowToCalls[6]) sideKind, addrs[11] target, AuthenticatedProxy.HowToCall(feeMethodsSidesKindsHowToCalls[7]) howToCall, calldataSell calldata, replacementPatternSell replacementPattern, addrs[12] staticTarget, staticExtradataSell staticExtradata, ERC20(addrs[13]) paymentToken, uints[13] basePrice, uints[14] extra, uints[15] listingTime, uints[16] expirationTime, uints[17] salt),
 * - sellSig: Sig(vs[1], rssMetadata[2], rssMetadata[3]),
 * - metadata: rssMetadata[4]
 *
 * Lookup table for addrs[14]
 * - addrs[0] buy.exchange
 * - addrs[1] buy.maker
 * - addrs[2] buy.taker
 * - addrs[3] buy.feeRecipient
 * - addrs[4] buy.target
 * - addrs[5] buy.staticTarget
 * - addrs[6] buy.paymentToken
 * - addrs[7] sell.exchange
 * - addrs[8] sell.maker
 * - addrs[9] sell.taker
 * - addrs[10] sell.feeRecipient
 * - addrs[11] sell.target
 * - addrs[12] sell.staticTarget
 * - addrs[13] sell.paymentToken
 *
 * Lookup table for uints[18]
 * - uints[0] buy.makerRelayerFee
 * - uints[1] buy.takerRelayerFee
 * - uints[2] buy.makerProtocolFee
 * - uints[3] buy.takerProtocolFee
 * - uints[4] buy.basePrice
 * - uints[5] buy.extra
 * - uints[6] buy.listingTime
 * - uints[7] buy.expirationTime
 * - uints[8] buy.salt
 * - uints[9] sell.makerRelayerFee
 * - uints[10] sell.takerRelayerFee
 * - uints[11] sell.makerProtocolFee
 * - uints[12] sell.takerProtocolFee
 * - uints[13] sell.basePrice
 * - uints[14] sell.extra
 * - uints[15] sell.listingTime
 * - uints[16] sell.expirationTime
 * - uints[17] sell.salt
 *
 * Lookup table for feeMethodsSidesKindsHowToCalls[8]
 * - feeMethodsSidesKindsHowToCalls[0] buy.feeMethod
 * - feeMethodsSidesKindsHowToCalls[1] buy.side
 * - feeMethodsSidesKindsHowToCalls[2] buy.saleKind
 * - feeMethodsSidesKindsHowToCalls[3] buy.howToCall
 * - feeMethodsSidesKindsHowToCalls[4] sell.feeMethod
 * - feeMethodsSidesKindsHowToCalls[5] sell.side
 * - feeMethodsSidesKindsHowToCalls[6] sell.saleKind
 * - feeMethodsSidesKindsHowToCalls[7] sell.howToCall
 */

export function handleMatch(call: AtomicMatch_Call): void {
  // sellTarget is sell.target (addrs[11])
  let sellTarget = call.inputs.addrs[11];
  if (sellTarget.equals(WYVERN_ATOMICIZER_ADDRESS)) {
    handleBundleSale(call);
  } else {
    handleSingleSale(call);
  }
}

function handleSingleSale(call: AtomicMatch_Call): void {
  let dailyTradedItems = 0;
  let collectionAddrs: string[] = [];

  // paymentToken is buyOrder.paymentToken or SellOrder.payment token (addrs[6] or addrs[13])
  let paymentToken = call.inputs.addrs[13];

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResult = decodeSingleNftData(call, mergedCallData);
  if (!decodedTransferResult) {
    return;
  }

  let buyer = decodedTransferResult.to.toHexString();
  let seller = decodedTransferResult.from.toHexString();
  let collectionAddr = decodedTransferResult.token.toHexString();
  let tokenId = decodedTransferResult.tokenId;
  let amount = decodedTransferResult.amount;
  let saleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
  let strategy = getSaleStrategy(saleKind);
  let priceETH = calcTradePriceETH(call, paymentToken);

  collectionAddrs.push(collectionAddr);

  if (buyer != call.inputs.addrs[1].toHexString()) {
    log.debug(
      "buyMaker/receiver do not match, isBundle: {}, buyMaker: {}, reciever: {}, tx: {}",
      [
        false.toString(),
        call.inputs.addrs[1].toHexString(),
        buyer,
        call.transaction.hash.toHexString(),
      ]
    );
  }

  if (seller != call.inputs.addrs[8].toHexString()) {
    log.debug(
      "sellMaker/sender do not match, isBundle: {}, sellMaker: {}, sender: {}, tx: {}",
      [
        false.toString(),
        call.inputs.addrs[8].toHexString(),
        seller,
        call.transaction.hash.toHexString(),
      ]
    );
  }

  // No event log index since this is a contract call
  let tradeID = call.transaction.hash
    .toHexString()
    .concat("-")
    .concat(decodedTransferResult.method)
    .concat("-")
    .concat(tokenId.toString());
  let trade = new Trade(tradeID);
  trade.transactionHash = call.transaction.hash.toHexString();
  trade.timestamp = call.block.timestamp;
  trade.blockNumber = call.block.number;
  trade.isBundle = false;
  trade.collection = collectionAddr;
  trade.tokenId = tokenId;
  trade.priceETH = priceETH;
  trade.amount = amount;
  trade.strategy = strategy;
  trade.buyer = buyer;
  trade.seller = seller;
  trade.save();

  // Prepare for updating dailyTradedItemCount
  let newDailyTradedItem = false;
  let dailyTradedItemID = "DAILY_TRADED_ITEM-"
    .concat(collectionAddr)
    .concat("-")
    .concat(tokenId.toString())
    .concat("-")
    .concat((call.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
  let dailyTradedItem = _Item.load(dailyTradedItemID);
  if (!dailyTradedItem) {
    dailyTradedItem = new _Item(dailyTradedItemID);
    dailyTradedItem.save();
    newDailyTradedItem = true;
    dailyTradedItems += 1;
  }

  // Update Collection and daily snapshot
  updateCollectionMetrics(
    call,
    collectionAddr,
    buyer,
    seller,
    priceETH,
    newDailyTradedItem,
    trade.isBundle
  );

  // Update Marketplace and daily snapshot
  updateMarketplaceMetrics(
    call,
    collectionAddrs,
    buyer,
    seller,
    priceETH,
    dailyTradedItems
  );
}

function handleBundleSale(call: AtomicMatch_Call): void {
  let dailyTradedItems = 0;
  let collectionAddrs: string[] = [];

  // buyer is buyOrder.maker (addrs[1])
  let buyer = call.inputs.addrs[1].toHexString();
  // seller is sellOrder.maker (addrs[8])
  let seller = call.inputs.addrs[8].toHexString();
  // paymentToken is buyOrder.paymentToken or SellOrder.payment token (addrs[6] or addrs[13])
  let paymentToken = call.inputs.addrs[13];

  let bundlePriceETH = calcTradePriceETH(call, paymentToken);

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResults = decodeBundleNftData(call, mergedCallData);
  let tradeSize = BigInt.fromI32(decodedTransferResults.length).toBigDecimal();
  for (let i = 0; i < decodedTransferResults.length; i++) {
    let collectionAddr = decodedTransferResults[i].token.toHexString();
    let tokenId = decodedTransferResults[i].tokenId;
    let amount = decodedTransferResults[i].amount;
    let saleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
    let strategy = getSaleStrategy(saleKind);
    // Average price of token in bundle
    let avgTradePriceETH = bundlePriceETH.div(tradeSize);

    collectionAddrs.push(collectionAddr);

    if (strategy == SaleStrategy.DUTCH_AUCTION) {
      log.debug("dutch auction sale in a bundle sale, transaction: {}", [
        call.transaction.hash.toHexString(),
      ]);
    }

    if (buyer != decodedTransferResults[i].to.toHexString()) {
      log.warning(
        "buyMaker/receiver do not match, isBundle: {}, buyMaker: {}, reciever: {}, tx: {}",
        [
          true.toString(),
          buyer,
          decodedTransferResults[i].to.toHexString(),
          call.transaction.hash.toHexString(),
        ]
      );
    }

    if (seller != decodedTransferResults[i].from.toHexString()) {
      log.warning(
        "sellMaker/sender do not match, isBundle: {}, sellMaker: {}, sender: {}, tx: {}",
        [
          true.toString(),
          seller,
          decodedTransferResults[i].from.toHexString(),
          call.transaction.hash.toHexString(),
        ]
      );
    }

    // No event log index since this is a contract call
    let tradeID = call.transaction.hash
      .toHexString()
      .concat("-")
      .concat(decodedTransferResults[i].method)
      .concat("-")
      .concat(tokenId.toString());
    let trade = new Trade(tradeID);
    trade.transactionHash = call.transaction.hash.toHexString();
    trade.timestamp = call.block.timestamp;
    trade.blockNumber = call.block.number;
    trade.isBundle = true;
    trade.collection = collectionAddr;
    trade.tokenId = tokenId;
    trade.priceETH = avgTradePriceETH;
    trade.amount = amount;
    trade.strategy = strategy;
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();

    // Prepare for updating dailyTradedItemCount
    let newDailyTradedItem = false;
    let dailyTradedItemID = "DAILY_TRADED_ITEM-"
      .concat(collectionAddr)
      .concat("-")
      .concat(tokenId.toString())
      .concat("-")
      .concat((call.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
    let dailyTradedItem = _Item.load(dailyTradedItemID);
    if (!dailyTradedItem) {
      dailyTradedItem = new _Item(dailyTradedItemID);
      dailyTradedItem.save();
      newDailyTradedItem = true;
      dailyTradedItems += 1;
    }

    // Update Collection and daily snapshot
    updateCollectionMetrics(
      call,
      collectionAddr,
      buyer,
      seller,
      avgTradePriceETH,
      newDailyTradedItem,
      trade.isBundle
    );
  }

  // Update Marketplace and daily snapshot
  updateMarketplaceMetrics(
    call,
    collectionAddrs,
    buyer,
    seller,
    bundlePriceETH,
    dailyTradedItems
  );
}

function updateCollectionMetrics(
  call: AtomicMatch_Call,
  collectionAddr: string,
  buyer: string,
  seller: string,
  priceETH: BigDecimal,
  newDailyTradedItem: bool,
  isBundle: bool
): void {
  let collection = getOrCreateCollection(collectionAddr);
  collection.tradeCount += 1;

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
    collection.cumulativeTradeVolumeETH.plus(priceETH);

  collection.save();

  // Update Collection revenue metrics
  updateCollectionRevenueMetrics(call, collectionAddr, priceETH, isBundle);

  // Update Collection daily snapshot
  let collectionSnapshot = getOrCreateCollectionDailySnapshot(
    collectionAddr,
    call.block.timestamp
  );

  collectionSnapshot.blockNumber = call.block.number;
  collectionSnapshot.timestamp = call.block.timestamp;
  collectionSnapshot.royaltyFee = collection.royaltyFee;

  // Update daily metrics
  if (newDailyTradedItem) {
    collectionSnapshot.dailyTradedItemCount += 1;
  }

  collectionSnapshot.dailyTradeVolumeETH =
    collectionSnapshot.dailyTradeVolumeETH.plus(priceETH);

  if (!isBundle) {
    collectionSnapshot.dailyMinSalePrice = min(
      collectionSnapshot.dailyMinSalePrice,
      priceETH
    );
    collectionSnapshot.dailyMaxSalePrice = max(
      collectionSnapshot.dailyMaxSalePrice,
      priceETH
    );
  }

  // Update snapshot metrics
  collectionSnapshot.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH;
  collectionSnapshot.marketplaceRevenueETH = collection.marketplaceRevenueETH;
  collectionSnapshot.creatorRevenueETH = collection.creatorRevenueETH;
  collectionSnapshot.totalRevenueETH = collection.totalRevenueETH;
  collectionSnapshot.tradeCount = collection.tradeCount;

  collectionSnapshot.save();
}

function updateMarketplaceMetrics(
  call: AtomicMatch_Call,
  collectionAddrs: string[],
  buyer: string,
  seller: string,
  priceETH: BigDecimal,
  dailyTradedItems: i32
): void {
  let marketplace = getOrCreateMarketplace(
    NetworkConfigs.getMarketplaceAddress()
  );
  marketplace.tradeCount += 1;
  marketplace.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH.plus(priceETH);

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

  // Update Marketplace revenue metrics
  updateMarketplaceRevenueMetrics(call, priceETH);

  // Update Marketplace daily snapshot
  let marketplaceSnapshot = getOrCreateMarketplaceDailySnapshot(
    call.block.timestamp
  );
  marketplaceSnapshot.blockNumber = call.block.number;
  marketplaceSnapshot.timestamp = call.block.timestamp;

  // Update daily metrics
  for (let i = 0; i < collectionAddrs.length; i++) {
    let collectionAddr = collectionAddrs[i];
    let dailyTradedCollectionID = "DAILY_TRADED_COLLECTION-"
      .concat(collectionAddr)
      .concat("-")
      .concat((call.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
    let dailyTradedCollection = _Item.load(dailyTradedCollectionID);
    if (!dailyTradedCollection) {
      dailyTradedCollection = new _Item(dailyTradedCollectionID);
      dailyTradedCollection.save();
      marketplaceSnapshot.dailyTradedCollectionCount += 1;
    }
  }

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

  marketplaceSnapshot.dailyTradedItemCount += dailyTradedItems;

  // Update snapshot metrics
  marketplaceSnapshot.collectionCount = marketplace.collectionCount;
  marketplaceSnapshot.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH;
  marketplaceSnapshot.marketplaceRevenueETH = marketplace.marketplaceRevenueETH;
  marketplaceSnapshot.creatorRevenueETH = marketplace.creatorRevenueETH;
  marketplaceSnapshot.totalRevenueETH = marketplace.totalRevenueETH;
  marketplaceSnapshot.tradeCount = marketplace.tradeCount;
  marketplaceSnapshot.cumulativeUniqueTraders =
    marketplace.cumulativeUniqueTraders;

  marketplaceSnapshot.save();
}

function updateCollectionRevenueMetrics(
  call: AtomicMatch_Call,
  collectionAddr: string,
  priceETH: BigDecimal,
  isBundle: bool
): void {
  let collection = getOrCreateCollection(collectionAddr);

  let sellSideFeeRecipient = call.inputs.addrs[10];
  if (sellSideFeeRecipient.notEqual(NULL_ADDRESS)) {
    // Sell-side order is maker (sale)
    let makerRelayerFee = call.inputs.uints[9];
    let creatorRoyaltyFeePercentage = EXCHANGE_MARKETPLACE_FEE.le(
      makerRelayerFee
    )
      ? makerRelayerFee
          .minus(EXCHANGE_MARKETPLACE_FEE)
          .divDecimal(BIGDECIMAL_HUNDRED)
      : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (
      collection.royaltyFee.notEqual(creatorRoyaltyFeePercentage) &&
      !isBundle
    ) {
      collection.royaltyFee = creatorRoyaltyFeePercentage;
    }

    let totalRevenueETH = makerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(makerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
          .times(priceETH)
          .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenue
    collection.totalRevenueETH =
      collection.totalRevenueETH.plus(totalRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    collection.creatorRevenueETH =
      collection.creatorRevenueETH.plus(creatorRevenueETH);
  } else {
    // Buy-side order is maker (bid/offer)
    let takerRelayerFee = call.inputs.uints[1];
    let creatorRoyaltyFeePercentage = EXCHANGE_MARKETPLACE_FEE.le(
      takerRelayerFee
    )
      ? takerRelayerFee
          .minus(EXCHANGE_MARKETPLACE_FEE)
          .divDecimal(BIGDECIMAL_HUNDRED)
      : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (
      collection.royaltyFee.notEqual(creatorRoyaltyFeePercentage) &&
      !isBundle
    ) {
      collection.royaltyFee = creatorRoyaltyFeePercentage;
    }

    let totalRevenueETH = takerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(takerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
          .times(priceETH)
          .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenue
    collection.totalRevenueETH =
      collection.totalRevenueETH.plus(totalRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    collection.creatorRevenueETH =
      collection.creatorRevenueETH.plus(creatorRevenueETH);
  }

  collection.save();
}

function updateMarketplaceRevenueMetrics(
  call: AtomicMatch_Call,
  priceETH: BigDecimal
): void {
  let marketplace = getOrCreateMarketplace(
    NetworkConfigs.getMarketplaceAddress()
  );

  let sellSideFeeRecipient = call.inputs.addrs[10];
  if (sellSideFeeRecipient.notEqual(NULL_ADDRESS)) {
    // Sell-side order is maker (sale)
    let makerRelayerFee = call.inputs.uints[9];

    let totalRevenueETH = makerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(makerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
          .times(priceETH)
          .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Marketplace revenue
    marketplace.totalRevenueETH =
      marketplace.totalRevenueETH.plus(totalRevenueETH);
    marketplace.marketplaceRevenueETH = marketplace.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    marketplace.creatorRevenueETH =
      marketplace.creatorRevenueETH.plus(creatorRevenueETH);
  } else {
    // Buy-side order is maker (bid/offer)
    let takerRelayerFee = call.inputs.uints[1];

    let totalRevenueETH = takerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(takerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
          .times(priceETH)
          .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Marketplace revenue
    marketplace.totalRevenueETH =
      marketplace.totalRevenueETH.plus(totalRevenueETH);
    marketplace.marketplaceRevenueETH = marketplace.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    marketplace.creatorRevenueETH =
      marketplace.creatorRevenueETH.plus(creatorRevenueETH);
  }

  marketplace.save();
}
