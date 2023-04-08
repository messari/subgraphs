import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { AToken } from "../../../../generated/MorphoAaveV2/AToken";
import { ERC20 } from "../../../../generated/MorphoAaveV2/ERC20";
import { LendingPool } from "../../../../generated/MorphoAaveV2/LendingPool";
import { LendingPoolAddressesProvider } from "../../../../generated/MorphoAaveV2/LendingPoolAddressesProvider";
import {
  MarketCreated,
  MorphoAaveV2,
} from "../../../../generated/MorphoAaveV2/MorphoAaveV2";
import {
  // Comptroller,
  LendingPool as LendingPoolTemplate,
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
} from "../../../../generated/templates";
import { PriceOracle } from "../../../../generated/MorphoAaveV2/PriceOracle";
import { ProtocolDataProvider } from "../../../../generated/MorphoAaveV2/ProtocolDataProvider";
import {
  LendingProtocol,
  Market,
  UnderlyingTokenMapping,
} from "../../../../generated/schema";
import {
  BASE_UNITS,
  BIGDECIMAL_ZERO,
  MORPHO_AAVE_V2_ADDRESS,
  WAD,
  getProtocolData,
} from "../../../../src/constants";
import {
  getOrInitLendingProtocol,
  getOrInitToken,
  getOrInitMarketList,
  getMarket,
} from "../../../../src/utils/initializers";
import {
  Borrowed,
  P2PAmountsUpdated,
  P2PBorrowDeltaUpdated,
  P2PSupplyDeltaUpdated,
  Supplied,
  BorrowerPositionUpdated,
  SupplierPositionUpdated,
  P2PIndexesUpdated,
  Liquidated,
  Withdrawn,
  Repaid,
  DefaultMaxGasForMatchingSet,
  IsBorrowPausedSet,
  IsDeprecatedSet,
  IsLiquidateBorrowPausedSet,
  IsLiquidateCollateralPausedSet,
  IsRepayPausedSet,
  IsSupplyPausedSet,
  IsWithdrawPausedSet,
  MaxSortedUsersSet,
  OwnershipTransferred,
  P2PIndexCursorSet,
  P2PStatusSet,
  PartialPauseStatusSet,
  PauseStatusSet,
  ReserveFactorSet,
  ReserveFeeClaimed,
} from "../../../../generated/MorphoAaveV2/MorphoAaveV2";
import { updateP2PRates } from "../../../../src/helpers";
import {
  _handleBorrowed,
  _handleBorrowerPositionUpdated,
  _handleLiquidated,
  _handleP2PIndexesUpdated,
  _handleRepaid,
  _handleSupplied,
  _handleSupplierPositionUpdated,
  _handleWithdrawn,
} from "../common";
import { DataManager } from "../../../../src/sdk/protocols/lending/manager";
import { BIGINT_ZERO } from "../../../../src/sdk/util/constants";

function updateProtocol(manager: DataManager): void {
  const protocol = manager.getProtocol();
  if (!protocol._defaultMaxGasForMatchingSupply) {
    // set morpho specific fields
    const morpho = MorphoAaveV2.bind(MORPHO_AAVE_V2_ADDRESS);
    const lendingPool = LendingPool.bind(morpho.pool());
    LendingPoolTemplate.create(lendingPool._address);
    const addressesProvider = LendingPoolAddressesProvider.bind(
      morpho.addressesProvider()
    );
    LendingPoolConfiguratorTemplate.create(
      addressesProvider.getLendingPoolConfigurator()
    );
    const tryDefaultMaxGas = morpho.try_defaultMaxGasForMatching();
    const tryMaxSortedUsers = morpho.try_maxSortedUsers();
    const tryOwner = morpho.try_owner();
    if (
      tryDefaultMaxGas.reverted ||
      tryMaxSortedUsers.reverted ||
      tryOwner.reverted
    ) {
      log.error(
        "[updateProtocol] defaultMaxGasForMatching, maxSortedUsers, or owner reverted",
        []
      );
      return;
    }
    protocol._defaultMaxGasForMatchingSupply =
      tryDefaultMaxGas.value.getSupply();
    protocol._defaultMaxGasForMatchingBorrow =
      tryDefaultMaxGas.value.getBorrow();
    protocol._defaultMaxGasForMatchingWithdraw =
      tryDefaultMaxGas.value.getWithdraw();
    protocol._defaultMaxGasForMatchingRepay = tryDefaultMaxGas.value.getRepay();
    protocol._maxSortedUsers = tryMaxSortedUsers.value;
    protocol._owner = tryOwner.value;
    protocol.save();
  }
}

export function handleMarketCreated(event: MarketCreated): void {
  // Sync protocol creation since MarketCreated is the first event emitted
  const aTokenContract = AToken.bind(event.params._poolToken);
  const tryUnderlying = aTokenContract.try_UNDERLYING_ASSET_ADDRESS();
  if (tryUnderlying.reverted) {
    log.warning(
      "MarketCreated reverted for poolToken in A Token Contract: {}",
      [event.params._poolToken.toHexString()]
    );
    return;
  }
  const manager = new DataManager(
    event.params._poolToken,
    tryUnderlying.value,
    event,
    getProtocolData(MORPHO_AAVE_V2_ADDRESS)
  );
  updateProtocol(manager); // add morpho specific data to protocol
  const market = manager.getMarket();

  const aToken = AToken.bind(event.params._poolToken);
  const underlying = ERC20.bind(aToken.UNDERLYING_ASSET_ADDRESS());
  const morpho = MorphoAaveV2.bind(event.address);
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
  market.name = `Morpho ${aToken.name()}`;
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

  market.borrowedToken = market.inputToken;
  market.variableBorrowedTokenBalance = BIGINT_ZERO;
  // TODO: token price
  // market.inputTokenPriceUSD = oracle
  //   .getAssetPrice(underlying._address)
  //   .toBigDecimal()
  //   .div(WAD)
  //   .div(ethPrice.toBigDecimal().div(WAD));

  const lendingPool = LendingPool.bind(morpho.pool());
  const tryReserveData = lendingPool.try_getReserveData(underlying._address);
  if (tryReserveData.reverted) {
    market.save();
    log.error(
      "[handleMarketCreated] getReserveData() contract call failed for market: {}",
      [event.params._poolToken.toHexString()]
    );
    return;
  }

  market._reserveSupplyIndex = tryReserveData.value.liquidityIndex;
  market._reserveBorrowIndex = tryReserveData.value.variableBorrowIndex;
  market._lastReserveUpdate = tryReserveData.value.lastUpdateTimestamp; // the current timestamp
  market._poolSupplyRate = tryReserveData.value.currentLiquidityRate;
  market._poolBorrowRate = tryReserveData.value.currentVariableBorrowRate;

  const tryMorphoMarketConfig = morpho.try_market(event.params._poolToken);
  const tryPoolIndexes = morpho.try_poolIndexes(event.params._poolToken);
  const tryP2pSupplyIndex = morpho.try_p2pSupplyIndex(event.params._poolToken);
  const tryP2pBorrowIndex = morpho.try_p2pBorrowIndex(event.params._poolToken);

  if (
    tryMorphoMarketConfig.reverted ||
    tryPoolIndexes.reverted ||
    tryP2pSupplyIndex.reverted ||
    tryP2pBorrowIndex.reverted
  ) {
    market.save();
    log.error(
      "[handleMarketCreated] Morpho market(), poolIndexes(), P2PSupplyIndex(), or P2PBorrowIndex() contract calls failed for market: {}",
      [event.params._poolToken.toHexString()]
    );
    return;
  }

  market._p2pSupplyIndex = tryP2pSupplyIndex.value;
  market._p2pBorrowIndex = tryP2pBorrowIndex.value;
  market._lastPoolSupplyIndex = tryPoolIndexes.value.getPoolSupplyIndex();
  market._lastPoolBorrowIndex = tryPoolIndexes.value.getPoolBorrowIndex();
  market._lastPoolUpdate = tryPoolIndexes.value.getLastUpdateTimestamp();

  market._scaledSupplyOnPool = BIGINT_ZERO;
  market._scaledSupplyInP2P = BIGINT_ZERO;
  market._scaledBorrowOnPool = BIGINT_ZERO;
  market._scaledBorrowInP2P = BIGINT_ZERO;
  market._virtualScaledSupply = BIGINT_ZERO;
  market._virtualScaledBorrow = BIGINT_ZERO;

  market._isP2PDisabled = tryMorphoMarketConfig.value.getIsP2PDisabled();

  market.reserveFactor = BigInt.fromI32(
    tryMorphoMarketConfig.value.getReserveFactor()
  )
    .toBigDecimal()
    .div(BASE_UNITS);
  market._p2pIndexCursor = BigInt.fromI32(
    tryMorphoMarketConfig.value.getP2pIndexCursor()
  )
    .toBigDecimal()
    .div(BASE_UNITS);

  market._totalSupplyOnPool = BIGDECIMAL_ZERO;
  market._totalBorrowOnPool = BIGDECIMAL_ZERO;
  market._totalSupplyInP2P = BIGDECIMAL_ZERO;
  market._totalBorrowInP2P = BIGDECIMAL_ZERO;

  const deltas = morpho.deltas(event.params._poolToken);
  market._p2pSupplyAmount = deltas.getP2pSupplyAmount();
  market._p2pBorrowAmount = deltas.getP2pBorrowAmount();

  market._p2pSupplyDelta = deltas.getP2pSupplyDelta();
  market._p2pBorrowDelta = deltas.getP2pBorrowDelta();

  market._poolSupplyAmount = BIGINT_ZERO;
  market._poolBorrowAmount = BIGINT_ZERO;

  const tokenMapping = new UnderlyingTokenMapping(underlying._address);
  tokenMapping.aToken = event.params._poolToken;
  const tokenAddresses = dataProvider.getReserveTokensAddresses(
    underlying._address
  );
  tokenMapping.debtToken = tokenAddresses.getVariableDebtTokenAddress();
  tokenMapping.save();

  market._isSupplyPaused = false;
  market._isBorrowPaused = false;
  market._isWithdrawPaused = false;
  market._isRepayPaused = false;
  market._isLiquidateBorrowPaused = false;
  market._isLiquidateCollateralPaused = false;

  market._poolSupplyInterests = BIGDECIMAL_ZERO;
  market._poolBorrowInterests = BIGDECIMAL_ZERO;
  market._p2pSupplyInterests = BIGDECIMAL_ZERO;
  market._p2pBorrowInterests = BIGDECIMAL_ZERO;
  market._p2pBorrowInterestsImprovement = BIGDECIMAL_ZERO;
  market._p2pBorrowInterestsImprovementUSD = BIGDECIMAL_ZERO;
  market._p2pSupplyInterestsImprovement = BIGDECIMAL_ZERO;
  market._p2pSupplyInterestsImprovementUSD = BIGDECIMAL_ZERO;
  market._poolSupplyInterestsUSD = BIGDECIMAL_ZERO;
  market._poolBorrowInterestsUSD = BIGDECIMAL_ZERO;
  market._p2pSupplyInterestsUSD = BIGDECIMAL_ZERO;
  market._p2pBorrowInterestsUSD = BIGDECIMAL_ZERO;
  market._indexesOffset = 27;
  market.rates = [];
  market.save();

  const list = getOrInitMarketList(event.address);
  const markets = list.markets;
  list.markets = markets.concat([market.id]);

  list.save();
}

export function handleBorrowed(event: Borrowed): void {
  return _handleBorrowed(
    event,
    event.params._poolToken,
    event.params._borrower,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleP2PAmountsUpdated(event: P2PAmountsUpdated): void {
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyAmount = event.params._p2pSupplyAmount;
  market._p2pBorrowAmount = event.params._p2pBorrowAmount;

  updateP2PRates(market);
  market.save();
}

export function handleP2PBorrowDeltaUpdated(
  event: P2PBorrowDeltaUpdated
): void {
  const market = getMarket(event.params._poolToken);
  market._p2pBorrowDelta = event.params._p2pBorrowDelta;
  updateP2PRates(market);
  market.save();
}

export function handleP2PSupplyDeltaUpdated(
  event: P2PSupplyDeltaUpdated
): void {
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyDelta = event.params._p2pSupplyDelta;
  updateP2PRates(market);
  market.save();
}

export function handleSupplied(event: Supplied): void {
  _handleSupplied(
    event,
    event.params._poolToken,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleBorrowerPositionUpdated(
  event: BorrowerPositionUpdated
): void {
  _handleBorrowerPositionUpdated(
    event,
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleSupplierPositionUpdated(
  event: SupplierPositionUpdated
): void {
  _handleSupplierPositionUpdated(
    event,
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleP2PIndexesUpdated(event: P2PIndexesUpdated): void {
  _handleP2PIndexesUpdated(
    event,
    event.params._poolToken,
    event.params._poolSupplyIndex,
    event.params._p2pSupplyIndex,
    event.params._poolBorrowIndex,
    event.params._p2pBorrowIndex
  );
}

export function handleLiquidated(event: Liquidated): void {
  _handleLiquidated(
    event,
    event.params._poolTokenCollateral,
    event.params._poolTokenBorrowed,
    event.params._liquidator,
    event.params._liquidated,
    event.params._amountSeized,
    event.params._amountRepaid
  );
}

export function handleWithdrawn(event: Withdrawn): void {
  _handleWithdrawn(
    event,
    event.params._poolToken,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleRepaid(event: Repaid): void {
  _handleRepaid(
    event,
    event.params._poolToken,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleDefaultMaxGasForMatchingSet(
  event: DefaultMaxGasForMatchingSet
): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol._defaultMaxGasForMatchingSupply =
    event.params._defaultMaxGasForMatching.supply;
  protocol._defaultMaxGasForMatchingBorrow =
    event.params._defaultMaxGasForMatching.borrow;
  protocol._defaultMaxGasForMatchingWithdraw =
    event.params._defaultMaxGasForMatching.withdraw;
  protocol._defaultMaxGasForMatchingRepay =
    event.params._defaultMaxGasForMatching.repay;
  protocol.save();
}

export function handleIsBorrowPausedSet(event: IsBorrowPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._isPaused;
  market.save();
}

export function handleIsDeprecatedSet(event: IsDeprecatedSet): void {
  const market = getMarket(event.params._poolToken);
  market.isActive = !event.params._isDeprecated;
  market.save();
}

export function handleIsLiquidateBorrowPausedSet(
  event: IsLiquidateBorrowPausedSet
): void {
  const market = getMarket(event.params._poolToken);
  market._isLiquidateBorrowPaused = event.params._isPaused;
  market.save();
}

export function handleIsLiquidateCollateralPausedSet(
  event: IsLiquidateCollateralPausedSet
): void {
  const market = getMarket(event.params._poolToken);
  market._isLiquidateCollateralPaused = event.params._isPaused;
  market.save();
}

export function handleIsRepayPausedSet(event: IsRepayPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market._isRepayPaused = event.params._isPaused;
  market.save();
}

export function handleIsSupplyPausedSet(event: IsSupplyPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market._isSupplyPaused = event.params._isPaused;
  market.save();
}

export function handleIsWithdrawPausedSet(event: IsWithdrawPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market._isWithdrawPaused = event.params._isPaused;
  market.save();
}

export function handleMaxSortedUsersSet(event: MaxSortedUsersSet): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol._maxSortedUsers = event.params._newValue;
  protocol.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol._owner = event.params.newOwner;
  protocol.save();
}

export function handleP2PIndexCursorSet(event: P2PIndexCursorSet): void {
  const market = getMarket(event.params._poolToken);
  market._p2pIndexCursor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();
}

export function handleP2PStatusSet(event: P2PStatusSet): void {
  const market = getMarket(event.params._poolToken);
  market._isP2PDisabled = event.params._isP2PDisabled;
  market.save();
}

export function handlePartialPauseStatusSet(
  event: PartialPauseStatusSet
): void {
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._newStatus;
  market._isSupplyPaused = event.params._newStatus;

  market.save();
}

export function handlePauseStatusSet(event: PauseStatusSet): void {
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._newStatus;
  market._isSupplyPaused = event.params._newStatus;
  market._isWithdrawPaused = event.params._newStatus;
  market._isRepayPaused = event.params._newStatus;
  market.save();
}
export function handleReserveFactorSet(event: ReserveFactorSet): void {
  const market = getMarket(event.params._poolToken);
  market.reserveFactor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();
}

export function handleReserveFeeClaimed(event: ReserveFeeClaimed): void {}
