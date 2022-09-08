import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { _Item, _User } from "../../generated/schema";
import * as constants from "../constants/constants";
import {
  createUserMarketplaceAccount,
  getOrCreateMarketplace,
  getOrCreateMarketplaceDailySnapshot,
} from "../constants/initializers";

export function updateMarketplace(
  tokenAmount: BigInt,
  punkIndex: BigInt,
  buyerAddress: Address,
  sellerAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  let marketplace = getOrCreateMarketplace();
  marketplace.tradeCount += 1;
  marketplace.cumulativeTradeVolumeETH = marketplace.cumulativeTradeVolumeETH.plus(
    tokenAmount.divDecimal(constants.ETH_DECIMALS)
  );
  marketplace.save();

  createUserMarketplaceAccount(buyerAddress, block);
  createUserMarketplaceAccount(sellerAddress, block);
  updateMarketplaceDailySnapshot(block, punkIndex);
}

export function updateMarketplaceDailySnapshot(
  block: ethereum.Block,
  tokenId: BigInt
): void {
  let marketplaceDailySnapshot = getOrCreateMarketplaceDailySnapshot(
    block.timestamp,
    block.number
  );
  let noOfDaysSinceUnix = (
    block.timestamp.toI32() / constants.SECONDS_PER_DAY
  ).toString();
  let isUniqueDailyTradedItem = false;
  let itemId = "DAILY_TRADED_ITEM"
    .concat("-")
    .concat(noOfDaysSinceUnix)
    .concat("-")
    .concat(tokenId.toString());
  let dailyTradedItem = _Item.load(itemId);
  if (!dailyTradedItem) {
    dailyTradedItem = new _Item(itemId);
    isUniqueDailyTradedItem = true;
  }
  marketplaceDailySnapshot.tradeCount += 1;
  marketplaceDailySnapshot.dailyActiveTraders += 2;
  marketplaceDailySnapshot.dailyTradedCollectionCount = 1;
  if (isUniqueDailyTradedItem) {
    marketplaceDailySnapshot.dailyTradedItemCount += 1;
  }
  marketplaceDailySnapshot.save();
}
