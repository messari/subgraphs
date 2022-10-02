import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import * as constants from "../constants/constants";
import { _Item, _User } from "../../generated/schema";
import {
  getOrCreateCollectionDailySnapshot,
  getOrCreateCollection,
  createUserCollectionAccount,
} from "../constants/initializers";
import { min, max } from "../constants/utils";

export function updateCollection(
  tokenAmount: BigInt,
  punkIndex: BigInt,
  buyerAddress: Address,
  sellerAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  let collection = getOrCreateCollection();
  collection.cumulativeTradeVolumeETH = collection.cumulativeTradeVolumeETH.plus(
    tokenAmount.divDecimal(constants.ETH_DECIMALS)
  );
  collection.tradeCount += 1;
  collection.save();
  createUserCollectionAccount(constants.TradeType.BUYER, buyerAddress);
  createUserCollectionAccount(constants.TradeType.SELLER, sellerAddress);
  updateCollectionSnapshot(block, tokenAmount, punkIndex);
}

export function updateCollectionSnapshot(
  block: ethereum.Block,
  tokenAmount: BigInt,
  tokenId: BigInt
): void {
  let collectionDailySnapshot = getOrCreateCollectionDailySnapshot(
    block
  );

  collectionDailySnapshot.dailyMinSalePrice = min(
    tokenAmount.divDecimal(constants.ETH_DECIMALS),
    collectionDailySnapshot.dailyMinSalePrice
  );
  collectionDailySnapshot.dailyMaxSalePrice = max(
    tokenAmount.divDecimal(constants.ETH_DECIMALS),
    collectionDailySnapshot.dailyMaxSalePrice
  );

  collectionDailySnapshot.dailyTradeVolumeETH = collectionDailySnapshot.dailyTradeVolumeETH.plus(
    tokenAmount.divDecimal(constants.ETH_DECIMALS)
  );
  collectionDailySnapshot.tradeCount += 1;
  let dailyTradedItemId = "DAILY_TRADED_ITEM-"
    .concat((block.timestamp.toI32() / constants.SECONDS_PER_DAY).toString())
    .concat(tokenId.toString());
  let dailyTradedItem = _Item.load(dailyTradedItemId);
  if (!dailyTradedItem) {
    dailyTradedItem = new _Item(dailyTradedItemId);
    dailyTradedItem.save();
    collectionDailySnapshot.dailyTradedItemCount += 1;
  }

  collectionDailySnapshot.save();
}
