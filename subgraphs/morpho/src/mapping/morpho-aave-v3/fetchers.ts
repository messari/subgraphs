import {
  readValue,
  INT_EIGHT,
  exponentToBigInt,
  exponentToBigDecimal,
  MORPHO_AAVE_V3_ADDRESS,
} from "../../constants";
import {
  Market,
  LendingProtocol,
  UnderlyingTokenMapping,
} from "../../../generated/schema";
import {
  getOrInitToken,
  getOrInitLendingProtocol,
} from "../../utils/initializers";
import { MorphoPositions } from "../common";
import { AToken } from "../../../generated/Morpho/AToken";
import { DebtToken } from "../../../generated/Morpho/DebtToken";
import { LendingPool } from "../../../generated/Morpho/LendingPool";
import { PriceOracle } from "../../../generated/Morpho/PriceOracle";
import { MorphoAaveV3 } from "../../../generated/Morpho/MorphoAaveV3";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { LendingPool as LendingPoolTemplate } from "../../../generated/templates";
import { LendingPoolAddressesProvider } from "../../../generated/Morpho/LendingPoolAddressesProvider";
import { LendingPoolConfigurator as LendingPoolConfiguratorTemplate } from "../../../generated/templates";

export function getAaveProtocol(protocolAddress: Address): LendingProtocol {
  const morpho = getOrInitLendingProtocol(protocolAddress);

  if (morpho.isNew) {
    const morphoContract = MorphoAaveV3.bind(protocolAddress);
    const lendingPool = LendingPool.bind(morphoContract.pool());
    LendingPoolTemplate.create(lendingPool._address);
    const addressesProvider = LendingPoolAddressesProvider.bind(
      morphoContract.addressesProvider(),
    );
    LendingPoolConfiguratorTemplate.create(
      addressesProvider.getPoolConfigurator(),
    );

    // TODO: Do we have any alternate function calls/events for these variables??
    // const defaultMaxGas = morphoContract.defaultMaxGasForMatching();
    // morpho.protocol._defaultMaxGasForMatchingSupply = defaultMaxGas.getSupply();
    // morpho.protocol._defaultMaxGasForMatchingBorrow = defaultMaxGas.getBorrow();
    // morpho.protocol._defaultMaxGasForMatchingWithdraw =
    //   defaultMaxGas.getWithdraw();
    // morpho.protocol._defaultMaxGasForMatchingRepay = defaultMaxGas.getRepay();
    // morpho.protocol._maxSortedUsers = morphoContract.maxSortedUsers();

    morpho.protocol._owner = morphoContract.owner();
    morpho.protocol.save();
  }

  return morpho.protocol;
}

export const fetchMorphoPositionsAaveV3 = (market: Market): MorphoPositions => {
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
      BigInt.zero(),
    );
  }

  const aToken = AToken.bind(aTokenAddress);
  const debtToken = DebtToken.bind(Address.fromBytes(tokenMapping.debtToken));
  const morpho = MorphoAaveV3.bind(MORPHO_AAVE_V3_ADDRESS);
  const morphoSupplyOnPool_BI = aToken.balanceOf(MORPHO_AAVE_V3_ADDRESS);

  const marketInfo = morpho.market(Address.fromBytes(market.inputToken));

  const morphoSupplyOnPool = morphoSupplyOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoSupplyP2P_BI = marketInfo.deltas.supply.scaledP2PTotal
    .times(marketInfo.indexes.supply.p2pIndex)
    .div(exponentToBigInt(market._indexesOffset));

  const morphoSupplyP2P = morphoSupplyP2P_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowOnPool_BI = debtToken.balanceOf(MORPHO_AAVE_V3_ADDRESS);
  const morphoBorrowOnPool = morphoBorrowOnPool_BI
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));

  const morphoBorrowP2P_BI = marketInfo.deltas.borrow.scaledP2PTotal
    .times(marketInfo.indexes.borrow.p2pIndex)
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
    morphoBorrowP2P_BI,
  );
};

export function fetchAssetPrice(market: Market): BigDecimal {
  const inputTokenAddress = Address.fromString(market.inputToken.toHexString());

  const morphoProtocol = LendingProtocol.load(MORPHO_AAVE_V3_ADDRESS);
  if (!morphoProtocol) return BigDecimal.zero(); // Morpho not initialized yet
  const morpho = MorphoAaveV3.bind(MORPHO_AAVE_V3_ADDRESS);
  const addressesProvider = LendingPoolAddressesProvider.bind(
    morpho.addressesProvider(),
  );

  const oracle = PriceOracle.bind(addressesProvider.getPriceOracle());

  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(inputTokenAddress),
    BigInt.zero(),
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BigInt.zero())) {
    const tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      const fallbackOracle = PriceOracle.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(inputTokenAddress),
        BigInt.zero(),
      );
    }
  }

  return oracleResult.toBigDecimal().div(exponentToBigDecimal(INT_EIGHT));
}
