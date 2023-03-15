import { Address } from "@graphprotocol/graph-ts";

import { CToken } from "../../../generated/MorphoCompound/CToken";
import { MorphoCompound } from "../../../generated/MorphoCompound/MorphoCompound";
import { Market } from "../../../generated/schema";
import {
  exponentToBigDecimal,
  exponentToBigInt,
  MORPHO_COMPOUND_ADDRESS,
} from "../../constants";
import { MorphoPositions } from "../../mapping/common";
import { getOrInitToken } from "../initializers";

export const fetchMorphoPositionsCompound = (
  market: Market
): MorphoPositions => {
  const marketAddress = Address.fromBytes(market.id);
  const inputToken = getOrInitToken(market.inputToken);
  const cToken = CToken.bind(marketAddress);
  const morpho = MorphoCompound.bind(MORPHO_COMPOUND_ADDRESS);

  const morphoSupplyOnPool_BI = cToken.balanceOfUnderlying(
    MORPHO_COMPOUND_ADDRESS
  );

  const morphoSupplyOnPool = morphoSupplyOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowOnPool_BI = cToken.borrowBalanceCurrent(
    MORPHO_COMPOUND_ADDRESS
  );

  const morphoBorrowOnPool = morphoBorrowOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoDeltas = morpho.deltas(marketAddress);

  const morphoSupplyP2P_BI = morphoDeltas
    .getP2pSupplyAmount()
    .times(morpho.p2pSupplyIndex(marketAddress))
    .div(exponentToBigInt(market._indexesOffset));

  const morphoSupplyP2P = morphoSupplyP2P_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowP2P_BI = morphoDeltas
    .getP2pBorrowAmount()
    .times(morpho.p2pBorrowIndex(marketAddress))
    .div(exponentToBigInt(market._indexesOffset));
  const morphoBorrowP2P = morphoBorrowP2P_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  return new MorphoPositions(
    morphoSupplyOnPool,
    morphoBorrowOnPool,
    morphoSupplyP2P,
    morphoBorrowP2P,
    morphoSupplyOnPool_BI,
    morphoBorrowOnPool_BI,
    morphoSupplyP2P_BI,
    morphoBorrowP2P_BI
  );
};
