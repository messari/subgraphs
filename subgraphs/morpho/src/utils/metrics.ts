import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import { RAY } from "../constants";

import { getMarket } from "./initializers";

export const getMarketTotalSupply = (marketAddress: Address): BigDecimal => {
  const market = getMarket(marketAddress);
  return market.totalSupplyOnPool
    .times(market.reserveSupplyIndex.toBigDecimal().div(RAY))
    .plus(
      market.totalSupplyInP2P.times(
        market.p2pSupplyIndex.toBigDecimal().div(RAY)
      )
    );
};

export const getMarketTotalBorrow = (marketAddress: Address): BigDecimal => {
  const market = getMarket(marketAddress);
  return market.totalBorrowOnPool
    .times(market.reserveBorrowIndex.toBigDecimal().div(RAY))
    .plus(
      market.totalBorrowInP2P.times(
        market.p2pBorrowIndex.toBigDecimal().div(RAY)
      )
    );
};
