import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { AToken } from "../../../generated/MorphoAaveV2/AToken";
import { ERC20 } from "../../../generated/MorphoAaveV2/ERC20";
import { LendingPool } from "../../../generated/MorphoAaveV2/LendingPool";
import { LendingPoolAddressesProvider } from "../../../generated/MorphoAaveV2/LendingPoolAddressesProvider";
import {
  MarketCreated,
  MorphoAaveV2,
} from "../../../generated/MorphoAaveV2/MorphoAaveV2";
import { PriceOracle } from "../../../generated/MorphoAaveV2/PriceOracle";
import { ProtocolDataProvider } from "../../../generated/MorphoAaveV2/ProtocolDataProvider";
import { Market, UnderlyingTokenMapping } from "../../../generated/schema";
import { BASE_UNITS, WAD } from "../../constants";
import {
  getOrInitLendingProtocol,
  getOrInitMarketList,
  getOrInitToken,
} from "../../utils/initializers";

export function handleMarketCreated(event: MarketCreated): void {
  // Sync protocol creation since MarketCreated is the first event emitted
  const protocol = getOrInitLendingProtocol(event.address);
  protocol.totalPoolCount = protocol.totalPoolCount + 1;
  protocol.save();

  const aToken = AToken.bind(event.params._poolToken);
  const underlying = ERC20.bind(aToken.UNDERLYING_ASSET_ADDRESS());
  const market = new Market(event.params._poolToken);
  const morpho = MorphoAaveV2.bind(event.address);

  const lendingPool = LendingPool.bind(morpho.pool());
  const addressProvider = LendingPoolAddressesProvider.bind(
    morpho.addressesProvider()
  );
  const oracle = PriceOracle.bind(addressProvider.getPriceOracle());
  const USDC = Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
  const ethPrice = oracle.getAssetPrice(USDC);
  const dataProvider = ProtocolDataProvider.bind(
    addressProvider.getAddress(Bytes.fromHexString("0x01"))
  );
  const reserveConfiguration = dataProvider.getReserveConfigurationData(
    underlying._address
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
  market.inputTokenBalance = underlying.balanceOf(event.params._poolToken);
  market.inputTokenPriceUSD = oracle
    .getAssetPrice(underlying._address)
    .toBigDecimal()
    .div(WAD)
    .div(ethPrice.toBigDecimal().div(WAD));

  const morphoMarket = morpho.market(event.params._poolToken);
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

  const morphoPoolIndexes = morpho.poolIndexes(event.params._poolToken);

  const poolReserveData = lendingPool.getReserveData(underlying._address);
  market._reserveSupplyIndex = poolReserveData.liquidityIndex;
  market._reserveBorrowIndex = poolReserveData.variableBorrowIndex;
  market._lastReserveUpdate = poolReserveData.lastUpdateTimestamp; // the current timestamp

  market._poolSupplyRate = poolReserveData.currentLiquidityRate;
  market._poolBorrowRate = poolReserveData.currentVariableBorrowRate;

  market._p2pSupplyIndex = morpho.p2pSupplyIndex(event.params._poolToken);
  market._p2pBorrowIndex = morpho.p2pBorrowIndex(event.params._poolToken);

  market._lastPoolSupplyIndex = morphoPoolIndexes.getPoolSupplyIndex();
  market._lastPoolBorrowIndex = morphoPoolIndexes.getPoolBorrowIndex();
  market._lastPoolUpdate = morphoPoolIndexes.getLastUpdateTimestamp();

  market._scaledSupplyOnPool = BigInt.zero();
  market._scaledSupplyInP2P = BigInt.zero();
  market._scaledBorrowOnPool = BigInt.zero();
  market._scaledBorrowInP2P = BigInt.zero();
  market._virtualScaledSupply = BigInt.zero();
  market._virtualScaledBorrow = BigInt.zero();

  market.isP2PDisabled = morphoMarket.getIsP2PDisabled();

  market.reserveFactor = BigInt.fromI32(morphoMarket.getReserveFactor())
    .toBigDecimal()
    .div(BASE_UNITS);
  market.p2pIndexCursor = BigInt.fromI32(morphoMarket.getP2pIndexCursor())
    .toBigDecimal()
    .div(BASE_UNITS);

  market.totalSupplyOnPool = BigDecimal.zero();
  market.totalBorrowOnPool = BigDecimal.zero();
  market.totalSupplyInP2P = BigDecimal.zero();
  market.totalBorrowInP2P = BigDecimal.zero();

  const deltas = morpho.deltas(event.params._poolToken);
  market._p2pSupplyAmount = deltas.getP2pSupplyAmount();
  market._p2pBorrowAmount = deltas.getP2pBorrowAmount();

  market._p2pSupplyDelta = deltas.getP2pSupplyDelta();
  market._p2pBorrowDelta = deltas.getP2pBorrowDelta();

  market.poolSupplyAmount = BigInt.zero();
  market.poolBorrowAmount = BigInt.zero();

  const tokenMapping = new UnderlyingTokenMapping(underlying._address);
  tokenMapping.aToken = event.params._poolToken;
  const tokenAddresses = dataProvider.getReserveTokensAddresses(
    underlying._address
  );
  tokenMapping.debtToken = tokenAddresses.getVariableDebtTokenAddress();
  tokenMapping.save();

  market.isSupplyPaused = false;
  market.isBorrowPaused = false;
  market.isWithdrawPaused = false;
  market.isRepayPaused = false;
  market.isLiquidateBorrowPaused = false;
  market.isLiquidateCollateralPaused = false;

  market.poolSupplyInterests = BigDecimal.zero();
  market.poolBorrowInterests = BigDecimal.zero();
  market.p2pSupplyInterests = BigDecimal.zero();
  market.p2pBorrowInterests = BigDecimal.zero();
  market.p2pBorrowInterestsImprovement = BigDecimal.zero();
  market.p2pBorrowInterestsImprovementUSD = BigDecimal.zero();
  market.p2pSupplyInterestsImprovement = BigDecimal.zero();
  market.p2pSupplyInterestsImprovementUSD = BigDecimal.zero();
  market.poolSupplyInterestsUSD = BigDecimal.zero();
  market.poolBorrowInterestsUSD = BigDecimal.zero();
  market.p2pSupplyInterestsUSD = BigDecimal.zero();
  market.p2pBorrowInterestsUSD = BigDecimal.zero();
  market._indexesOffset = 27;
  market.rates = [];
  market.save();

  const list = getOrInitMarketList(event.address);
  const markets = list.markets;
  list.markets = markets.concat([market.id]);

  list.save();
}
