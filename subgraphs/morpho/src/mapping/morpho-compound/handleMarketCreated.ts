import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CToken } from "../../../generated/Morpho/CToken";
import { CompoundOracle } from "../../../generated/Morpho/CompoundOracle";
import { Comptroller } from "../../../generated/Morpho/Comptroller";
import {
  MarketCreated,
  MorphoCompound,
} from "../../../generated/Morpho/MorphoCompound";
import { Market } from "../../../generated/schema";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import {
  BASE_UNITS,
  BIGDECIMAL_ONE,
  C_ETH,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  WRAPPED_ETH,
} from "../../constants";
import { getOrInitMarketList, getOrInitToken } from "../../utils/initializers";
import { getCompoundProtocol } from "./fetchers";

export function handleMarketCreated(event: MarketCreated): void {
  // Sync protocol creation since MarketCreated is the first event emitted
  CTokenTemplate.create(event.params._poolToken);
  const protocol = getCompoundProtocol(event.address);
  protocol.totalPoolCount = protocol.totalPoolCount + 1;
  protocol.save();
  const morpho = MorphoCompound.bind(event.address);
  const cToken = CToken.bind(event.params._poolToken);
  const comptroller = Comptroller.bind(morpho.comptroller());
  const priceOracle = CompoundOracle.bind(comptroller.oracle());
  let underlying: Address;
  if (event.params._poolToken.equals(C_ETH)) underlying = WRAPPED_ETH;
  else underlying = cToken.underlying();
  const inputToken = getOrInitToken(underlying);
  const usdPrice = priceOracle
    .getUnderlyingPrice(event.params._poolToken)
    .toBigDecimal()
    .div(exponentToBigDecimal(36 - inputToken.decimals));
  const market = new Market(event.params._poolToken);
  market.protocol = event.address;
  market.name = `Morpho ${cToken.name()}`;
  market.isActive = true;
  market.canBorrowFrom = true;
  market.canUseAsCollateral = true;
  const compMarket = comptroller.markets(event.params._poolToken);
  market.maximumLTV = compMarket
    .getCollateralFactorMantissa()
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  market.liquidationThreshold = market.maximumLTV;
  market.liquidationPenalty = comptroller
    .liquidationIncentiveMantissa()
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .minus(BIGDECIMAL_ONE);

  market.canIsolate = false;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.inputToken = inputToken.id;
  market.borrowedToken = inputToken.id;
  market.stableBorrowedTokenBalance = BigInt.zero(); // There is no stable borrow on Morpho
  market.variableBorrowedTokenBalance = BigInt.zero();
  market.inputTokenBalance = cToken.getCash();
  market.inputTokenPriceUSD = usdPrice;
  const morphoMarket = morpho.marketParameters(event.params._poolToken);
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

  const morphoPoolIndexes = morpho.lastPoolIndexes(event.params._poolToken);

  market._reserveSupplyIndex = cToken.exchangeRateStored();
  market._reserveBorrowIndex = cToken.borrowIndex();
  market._lastReserveUpdate = cToken.accrualBlockNumber();

  market._poolSupplyRate = cToken.supplyRatePerBlock();
  market._poolBorrowRate = cToken.borrowRatePerBlock();

  market._p2pSupplyIndex = morpho.p2pSupplyIndex(event.params._poolToken);
  market._p2pBorrowIndex = morpho.p2pBorrowIndex(event.params._poolToken);

  market._lastPoolSupplyIndex = morphoPoolIndexes.getLastSupplyPoolIndex();
  market._lastPoolBorrowIndex = morphoPoolIndexes.getLastBorrowPoolIndex();
  market._lastPoolUpdate = morphoPoolIndexes.getLastUpdateBlockNumber();

  market._isP2PDisabled = morpho.p2pDisabled(event.params._poolToken);

  market.reserveFactor = BigInt.fromI32(morphoMarket.getReserveFactor())
    .toBigDecimal()
    .div(BASE_UNITS);
  market._p2pIndexCursor = BigInt.fromI32(morphoMarket.getP2pIndexCursor())
    .toBigDecimal()
    .div(BASE_UNITS);

  market._totalSupplyOnPool = BigDecimal.zero();
  market._totalBorrowOnPool = BigDecimal.zero();
  market._totalSupplyInP2P = BigDecimal.zero();
  market._totalBorrowInP2P = BigDecimal.zero();

  const delta = morpho.deltas(event.params._poolToken);
  market._p2pSupplyDelta = delta.getP2pSupplyDelta();
  market._p2pBorrowDelta = delta.getP2pBorrowDelta();
  market._p2pSupplyAmount = delta.getP2pSupplyAmount();
  market._p2pBorrowAmount = delta.getP2pBorrowAmount();

  market._scaledSupplyOnPool = BigInt.zero();
  market._scaledSupplyInP2P = BigInt.zero();
  market._scaledBorrowOnPool = BigInt.zero();
  market._scaledBorrowInP2P = BigInt.zero();
  market._virtualScaledSupply = BigInt.zero();
  market._virtualScaledBorrow = BigInt.zero();

  market._poolSupplyAmount = BigInt.zero();
  market._poolBorrowAmount = BigInt.zero();
  market._isSupplyPaused = false;
  market._isBorrowPaused = false;
  market._isWithdrawPaused = false;
  market._isRepayPaused = false;
  market._isLiquidateBorrowPaused = false;
  market._isLiquidateCollateralPaused = false;

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
  market._indexesOffset = 18;
  market.rates = [];

  // Compound borrow cap
  market.borrowCap = comptroller.borrowCaps(event.params._poolToken);

  market.save();

  const list = getOrInitMarketList(event.address);
  const markets = list.markets;
  list.markets = markets.concat([market.id]);

  list.save();
}
