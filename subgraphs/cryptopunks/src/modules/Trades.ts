import * as constants from "../constants/constants";
import { getOrCreateTrade } from "../constants/initializers";
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import {
  getHighestBiddersAddress,
  getSellerAddressFromPunksOfferedForSale,
  getStrategy,
} from "../constants/utils";
import { updateCollection } from "./Collections";
import { _Bid } from "../../generated/schema";
import { updateMarketplace } from "./Marketplaces";

export function updateTrades(
  tokenAmount: BigInt,
  punkIndex: BigInt,
  buyerAddress: Address,
  sellerAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const strategy = getStrategy(punkIndex, buyerAddress);
  let bAddress = buyerAddress;
  let tempAmount = tokenAmount;
  if (strategy === constants.SaleStrategy.PRIVATE_SALE) {
    bAddress = getSellerAddressFromPunksOfferedForSale(punkIndex);
    const highestBidderAddress = getHighestBiddersAddress(punkIndex);
    const bidId = punkIndex
      .toString()
      .concat("-")
      .concat(highestBidderAddress.toHexString());
    const winningBid = _Bid.load(bidId) as _Bid;
    tempAmount = winningBid.tokensBid;
  }

  createTradeTransaction(
    tempAmount,
    punkIndex,
    bAddress,
    sellerAddress,
    strategy,
    transaction,
    block
  );

  updateMarketplace(
    tempAmount,
    punkIndex,
    bAddress,
    sellerAddress,
    transaction,
    block
  );
  updateCollection(
    tempAmount,
    punkIndex,
    bAddress,
    sellerAddress,
    transaction,
    block
  );
}

export function createTradeTransaction(
  tokenAmount: BigInt,
  punkIndex: BigInt,
  buyerAddress: Address,
  sellerAddress: Address,
  strategy: string,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const trade = getOrCreateTrade(
    transaction.hash.toHexString(),
    transaction.index
  );
  trade.timestamp = block.timestamp;
  trade.blockNumber = block.number;

  trade.amount = constants.BIGINT_ONE;
  trade.priceETH = tokenAmount.divDecimal(constants.ETH_DECIMALS);
  trade.strategy = strategy;
  trade.tokenId = punkIndex;
  trade.buyer = buyerAddress.toHexString();
  trade.seller = sellerAddress.toHexString();
  trade.save();
}
