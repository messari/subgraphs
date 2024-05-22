import {
  MorphoAaveV3,
  MarketCreated,
} from "../../../generated/Morpho/MorphoAaveV3";
import { getAaveProtocol } from "./fetchers";
import { BASE_UNITS, WAD } from "../../constants";
import { ERC20 } from "../../../generated/Morpho/ERC20";
import { AToken } from "../../../generated/Morpho/AToken";
import { updateProtocolAfterNewMarket } from "../../helpers";
import { LendingPool } from "../../../generated/Morpho/LendingPool";
import { PriceOracle } from "../../../generated/Morpho/PriceOracle";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Market, UnderlyingTokenMapping } from "../../../generated/schema";
import { getOrInitMarketList, getOrInitToken } from "../../utils/initializers";
import { ProtocolDataProvider } from "../../../generated/Morpho/ProtocolDataProvider";
import { LendingPoolAddressesProvider } from "../../../generated/Morpho/LendingPoolAddressesProvider";

export function handleMarketCreated(event: MarketCreated): void {
  // Sync protocol creation since MarketCreated is the first event emitted
  const protocol = getAaveProtocol(event.address);
  const morpho = MorphoAaveV3.bind(event.address);

  const underlying = ERC20.bind(event.params.underlying);
  const marketInfo = morpho.market(event.params.underlying);

  const aToken = AToken.bind(marketInfo.aToken);
  const market = new Market(marketInfo.aToken);

  const lendingPool = LendingPool.bind(morpho.pool());
  const addressProvider = LendingPoolAddressesProvider.bind(
    morpho.addressesProvider(),
  );

  const oracle = PriceOracle.bind(addressProvider.getPriceOracle());
  const USDC = Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
  const ethPrice = oracle.getAssetPrice(USDC);
  const dataProvider = ProtocolDataProvider.bind(
    addressProvider.getPoolDataProvider(),
  );
  const reserveConfiguration = dataProvider.getReserveConfigurationData(
    underlying._address,
  );
  market.protocol = event.address;
  market.name = `Morpho ${aToken.name()}`;
  market.isActive = true;
  market.canBorrowFrom = true;
  market.canUseAsCollateral = true;
  market.maximumLTV = reserveConfiguration
    .getLtv()
    .toBigDecimal()
    .div(BASE_UNITS);
  market.liquidationThreshold = reserveConfiguration
    .getLiquidationThreshold()
    .toBigDecimal()
    .div(BASE_UNITS);
  market.liquidationPenalty = reserveConfiguration
    .getLiquidationBonus()
    .toBigDecimal()
    .div(BASE_UNITS);
  market.canIsolate = false;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  const token = getOrInitToken(underlying._address);
  market.inputToken = token.id;
  market.borrowedToken = token.id;
  market.stableBorrowedTokenBalance = BigInt.zero(); // There is no stable borrow on Morpho
  market.variableBorrowedTokenBalance = BigInt.zero();
  market.inputTokenBalance = underlying.balanceOf(marketInfo.aToken);
  market.inputTokenPriceUSD = oracle
    .getAssetPrice(underlying._address)
    .toBigDecimal()
    .div(WAD)
    .div(ethPrice.toBigDecimal().div(WAD));

  market.totalValueLockedUSD = BigDecimal.zero();
  market.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
  market.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
  market.cumulativeTotalRevenueUSD = BigDecimal.zero();
  market.totalDepositBalanceUSD = BigDecimal.zero();
  market.cumulativeDepositUSD = BigDecimal.zero();
  market.totalBorrowBalanceUSD = BigDecimal.zero();
  market.cumulativeBorrowUSD = BigDecimal.zero();
  market.cumulativeLiquidateUSD = BigDecimal.zero();
  market.cumulativeTransferUSD = BigDecimal.zero();
  market.cumulativeFlashloanUSD = BigDecimal.zero();
  market.transactionCount = 0 as i32;
  market.depositCount = 0 as i32;
  market.withdrawCount = 0 as i32;
  market.borrowCount = 0 as i32;
  market.repayCount = 0 as i32;
  market.liquidationCount = 0 as i32;
  market.transferCount = 0 as i32;
  market.flashloanCount = 0 as i32;
  market.cumulativeUniqueUsers = 0 as i32;
  market.cumulativeUniqueDepositors = 0 as i32;
  market.cumulativeUniqueBorrowers = 0 as i32;
  market.cumulativeUniqueLiquidators = 0 as i32;
  market.cumulativeUniqueLiquidatees = 0 as i32;
  market.cumulativeUniqueTransferrers = 0 as i32;
  market.cumulativeUniqueFlashloaners = 0 as i32;

  market.positionCount = 0 as i32;
  market.openPositionCount = 0 as i32;
  market.closedPositionCount = 0 as i32;
  market.lendingPositionCount = 0 as i32;
  market.borrowingPositionCount = 0 as i32;

  const poolReserveData = lendingPool.getReserveData(underlying._address);
  market._reserveSupplyIndex = poolReserveData.liquidityIndex;
  market._reserveBorrowIndex = poolReserveData.variableBorrowIndex;
  market._lastReserveUpdate = poolReserveData.lastUpdateTimestamp; // the current timestamp

  market._poolSupplyRate = poolReserveData.currentLiquidityRate;
  market._poolBorrowRate = poolReserveData.currentVariableBorrowRate;

  market._p2pSupplyIndexFromRates = marketInfo.indexes.supply.p2pIndex;
  market._p2pBorrowIndexFromRates = marketInfo.indexes.borrow.p2pIndex;

  market._p2pSupplyRate = BigInt.zero();
  market._p2pBorrowRate = BigInt.zero();
  market._p2pIndexCursor_BI = BigInt.zero();
  market._reserveFactor_BI = BigInt.zero();
  market._reserveFactor_BI = BigInt.zero();

  market._p2pSupplyIndex = marketInfo.indexes.supply.p2pIndex;
  market._p2pBorrowIndex = marketInfo.indexes.borrow.p2pIndex;

  market._lastPoolSupplyIndex = marketInfo.indexes.supply.poolIndex;
  market._lastPoolBorrowIndex = marketInfo.indexes.borrow.poolIndex;
  market._lastPoolUpdate = marketInfo.lastUpdateTimestamp;

  market._scaledSupplyOnPool = BigInt.zero();
  market._scaledSupplyInP2P = BigInt.zero();
  market._scaledPoolCollateral = BigInt.zero();
  market._scaledBorrowOnPool = BigInt.zero();
  market._scaledBorrowInP2P = BigInt.zero();
  market._virtualScaledSupply = BigInt.zero();
  market._virtualScaledBorrow = BigInt.zero();

  market._isP2PDisabled = marketInfo.pauseStatuses.isP2PDisabled;

  market.reserveFactor = BigInt.fromI32(marketInfo.reserveFactor)
    .toBigDecimal()
    .div(BASE_UNITS);
  market._p2pIndexCursor = BigInt.fromI32(marketInfo.p2pIndexCursor)
    .toBigDecimal()
    .div(BASE_UNITS);

  market._totalSupplyOnPool = BigDecimal.zero();
  market._totalBorrowOnPool = BigDecimal.zero();
  market._totalSupplyInP2P = BigDecimal.zero();
  market._totalBorrowInP2P = BigDecimal.zero();

  market._p2pSupplyAmount = marketInfo.deltas.supply.scaledP2PTotal;
  market._p2pBorrowAmount = marketInfo.deltas.borrow.scaledP2PTotal;

  market._p2pSupplyDelta = marketInfo.deltas.supply.scaledDelta;
  market._p2pBorrowDelta = marketInfo.deltas.borrow.scaledDelta;

  market._poolSupplyAmount = BigInt.zero();
  market._poolBorrowAmount = BigInt.zero();

  const tokenMapping = new UnderlyingTokenMapping(underlying._address);
  tokenMapping.aToken = marketInfo.aToken;
  const tokenAddresses = dataProvider.getReserveTokensAddresses(
    underlying._address,
  );
  tokenMapping.debtToken = tokenAddresses.getVariableDebtTokenAddress();
  tokenMapping.save();

  market._isSupplyPaused = marketInfo.pauseStatuses.isSupplyPaused;
  market._isBorrowPaused = marketInfo.pauseStatuses.isBorrowPaused;
  market._isWithdrawPaused = marketInfo.pauseStatuses.isWithdrawPaused;
  market._isRepayPaused = marketInfo.pauseStatuses.isRepayPaused;
  market._isLiquidateBorrowPaused =
    marketInfo.pauseStatuses.isLiquidateBorrowPaused;
  market._isLiquidateCollateralPaused =
    marketInfo.pauseStatuses.isLiquidateCollateralPaused;

  market._poolSupplyInterests = BigDecimal.zero();
  market._poolBorrowInterests = BigDecimal.zero();
  market._p2pSupplyInterests = BigDecimal.zero();
  market._p2pBorrowInterests = BigDecimal.zero();
  market._p2pBorrowInterestsImprovement = BigDecimal.zero();
  market._p2pBorrowInterestsImprovementUSD = BigDecimal.zero();
  market._p2pSupplyInterestsImprovement = BigDecimal.zero();
  market._p2pSupplyInterestsImprovementUSD = BigDecimal.zero();
  market._poolSupplyInterestsUSD = BigDecimal.zero();
  market._poolBorrowInterestsUSD = BigDecimal.zero();
  market._p2pSupplyInterestsUSD = BigDecimal.zero();
  market._p2pBorrowInterestsUSD = BigDecimal.zero();
  market._indexesOffset = 27;
  market.rates = [];
  market.save();

  const list = getOrInitMarketList(event.address);
  const markets = list.markets;
  list.markets = markets.concat([market.id]);

  list.save();

  updateProtocolAfterNewMarket(market.id, protocol.id);
}
