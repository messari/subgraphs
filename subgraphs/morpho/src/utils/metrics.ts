import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { RAY } from "../constants";
import { getMarket } from "./initializers";

export const getMarketTotalSupply = (marketAddress: Address): BigDecimal => {
  const market = getMarket(marketAddress);
  return market
    ._totalSupplyOnPool!.times(
      market._reserveSupplyIndex!.toBigDecimal().div(RAY)
    )
    .plus(
      market._totalSupplyInP2P!.times(
        market._p2pSupplyIndex!.toBigDecimal().div(RAY)
      )
    );
};

export const getMarketTotalBorrow = (marketAddress: Address): BigDecimal => {
  const market = getMarket(marketAddress);
  return market
    ._totalBorrowOnPool!.times(
      market._reserveBorrowIndex!.toBigDecimal().div(RAY)
    )
    .plus(
      market._totalBorrowInP2P!.times(
        market._p2pBorrowIndex!.toBigDecimal().div(RAY)
      )
    );
};
