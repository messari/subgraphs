import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { AToken } from "../../../generated/MorphoAaveV2/AToken";
import { ChainlinkPriceFeed } from "../../../generated/MorphoAaveV2/ChainlinkPriceFeed";
import { DebtToken } from "../../../generated/MorphoAaveV2/DebtToken";
import { LendingPoolAddressesProvider } from "../../../generated/MorphoAaveV2/LendingPoolAddressesProvider";
import { MorphoAaveV2 } from "../../../generated/MorphoAaveV2/MorphoAaveV2";
import { PriceOracle } from "../../../generated/MorphoAaveV2/PriceOracle";
import {
  LendingProtocol,
  Market,
  UnderlyingTokenMapping,
} from "../../../generated/schema";
import {
  ETH_USD_PRICE_FEED_ADDRESS,
  exponentToBigDecimal,
  exponentToBigInt,
  MORPHO_AAVE_V2_ADDRESS,
  readValue,
} from "../../constants";
import { MorphoPositions } from "../../mapping/common";
import { getOrInitToken } from "../initializers";

export const fetchMorphoPositionsAaveV2 = (market: Market): MorphoPositions => {
  const aTokenAddress = Address.fromString(market.id.toHexString());
  const inputToken = getOrInitToken(market.inputToken);
  const tokenMapping = UnderlyingTokenMapping.load(market.inputToken);
  if (!tokenMapping) {
    log.critical("No token mapping found for reserve: {}", [
      market.id.toHexString(),
    ]);
    return new MorphoPositions(
      BigDecimal.zero(),
      BigDecimal.zero(),
      BigDecimal.zero(),
      BigDecimal.zero(),
      BigInt.zero(),
      BigInt.zero(),
      BigInt.zero(),
      BigInt.zero()
    );
  }

  const aToken = AToken.bind(aTokenAddress);

  const debtToken = DebtToken.bind(Address.fromBytes(tokenMapping.debtToken));

  const morpho = MorphoAaveV2.bind(MORPHO_AAVE_V2_ADDRESS);

  const morphoSupplyOnPool_BI = aToken.balanceOf(MORPHO_AAVE_V2_ADDRESS);

  const morphoSupplyOnPool = morphoSupplyOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoDeltas = morpho.deltas(aTokenAddress);

  const morphoSupplyP2P_BI = morphoDeltas
    .getP2pSupplyAmount()
    .times(morpho.p2pSupplyIndex(aTokenAddress))
    .div(exponentToBigInt(market._indexesOffset));

  const morphoSupplyP2P = morphoSupplyP2P_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowOnPool_BI = debtToken.balanceOf(MORPHO_AAVE_V2_ADDRESS);

  const morphoBorrowOnPool = morphoBorrowOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowP2P_BI = morphoDeltas
    .getP2pBorrowAmount()
    .times(morpho.p2pBorrowIndex(aTokenAddress))
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

export function fetchAssetPrice(market: Market): BigDecimal {
  const inputTokenAddress = Address.fromString(market.inputToken.toHexString());

  const morphoProtocol = LendingProtocol.load(MORPHO_AAVE_V2_ADDRESS);
  if (!morphoProtocol) return BigDecimal.zero(); // Morpho not initialized yet
  const morpho = MorphoAaveV2.bind(MORPHO_AAVE_V2_ADDRESS);
  const addressesProvider = LendingPoolAddressesProvider.bind(
    morpho.addressesProvider()
  );

  const oracle = PriceOracle.bind(addressesProvider.getPriceOracle());

  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(inputTokenAddress),
    BigInt.zero()
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BigInt.zero())) {
    const tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      const fallbackOracle = PriceOracle.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(inputTokenAddress),
        BigInt.zero()
      );
    }
  }

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  const ethPriceFeed = ChainlinkPriceFeed.bind(ETH_USD_PRICE_FEED_ADDRESS);
  const priceEthInUsd = ethPriceFeed
    .latestAnswer()
    .toBigDecimal()
    .div(exponentToBigDecimal(8)); // price is in 8 decimals (10^8)

  if (priceEthInUsd.equals(BigDecimal.zero())) {
    return BigDecimal.zero();
  } else {
    return oracleResult
      .toBigDecimal()
      .times(priceEthInUsd)
      .div(exponentToBigDecimal(18));
  }
}
