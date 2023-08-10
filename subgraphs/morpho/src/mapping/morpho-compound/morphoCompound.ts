import {
  Repaid,
  Supplied,
  Withdrawn,
  Borrowed,
  Liquidated,
  P2PStatusSet,
  PauseStatusSet,
  IsDeprecatedSet,
  IsRepayPausedSet,
  IsSupplyPausedSet,
  MaxSortedUsersSet,
  ReserveFactorSet,
  IsBorrowPausedSet,
  P2PIndexCursorSet,
  ReserveFeeClaimed,
  P2PAmountsUpdated,
  P2PIndexesUpdated,
  IsWithdrawPausedSet,
  OwnershipTransferred,
  PartialPauseStatusSet,
  P2PSupplyDeltaUpdated,
  P2PBorrowDeltaUpdated,
  SupplierPositionUpdated,
  BorrowerPositionUpdated,
  IsLiquidateBorrowPausedSet,
  DefaultMaxGasForMatchingSet,
  IsLiquidateCollateralPausedSet,
} from "../../../generated/Morpho/MorphoCompound";
import {
  BASE_UNITS,
  COMP_ADDRESS,
  CCOMP_ADDRESS,
  BLOCKS_PER_DAY,
  RewardTokenType,
  DEFAULT_DECIMALS,
  COMPTROLLER_ADDRESS,
  exponentToBigDecimal,
  MORPHO_COMPOUND_ADDRESS,
} from "../../constants";
import {
  _handleRepaid,
  _handleBorrowed,
  _handleSupplied,
  _handleWithdrawn,
  _handleLiquidated,
  _handleP2PIndexesUpdated,
  _handleBorrowerPositionUpdated,
  _handleSupplierPositionUpdated,
} from "../common";
import { getCompoundProtocol } from "./fetchers";
import { updateFinancials } from "../../helpers";
import { CToken } from "../../../generated/Morpho/CToken";
import { LendingProtocol, Market } from "../../../generated/schema";
import { Comptroller } from "../../../generated/Morpho/Comptroller";
import { CompoundOracle } from "../../../generated/Morpho/CompoundOracle";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { getMarket, getOrCreateRewardToken } from "../../utils/initializers";

export { handleMarketCreated } from "./handleMarketCreated";

export function handleP2PIndexesUpdated(event: P2PIndexesUpdated): void {
  const protocol = getCompoundProtocol(event.address);
  const market = getMarket(event.params._poolToken);

  _handleP2PIndexesUpdated(
    event,
    protocol,
    market,
    event.params._poolSupplyIndex,
    event.params._p2pSupplyIndex,
    event.params._poolBorrowIndex,
    event.params._p2pBorrowIndex
  );

  updateFinancials(protocol, event.block);
}

export function handleBorrowed(event: Borrowed): void {
  const protocol = getCompoundProtocol(event.address);
  const market = getMarket(event.params._poolToken);

  _handleBorrowed(
    event,
    protocol,
    market,
    event.params._borrower,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateFinancials(protocol, event.block);
}

export function handleBorrowerPositionUpdated(
  event: BorrowerPositionUpdated
): void {
  const protocol = getCompoundProtocol(event.address);

  _handleBorrowerPositionUpdated(
    event,
    protocol,
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateFinancials(protocol, event.block);
}

export function handleLiquidated(event: Liquidated): void {
  const protocol = getCompoundProtocol(event.address);

  _handleLiquidated(
    event,
    protocol,
    event.params._poolTokenCollateralAddress,
    event.params._poolTokenBorrowedAddress,
    event.params._liquidator,
    event.params._liquidated,
    event.params._amountSeized,
    event.params._amountRepaid
  );

  updateFinancials(protocol, event.block);
}

export function handleP2PAmountsUpdated(event: P2PAmountsUpdated): void {
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyAmount = event.params._p2pSupplyAmount;
  market._p2pBorrowAmount = event.params._p2pBorrowAmount;
  market.save();
}

export function handleP2PBorrowDeltaUpdated(
  event: P2PBorrowDeltaUpdated
): void {
  const market = getMarket(event.params._poolToken);
  market._p2pBorrowDelta = event.params._p2pBorrowDelta;
  market.save();
}

export function handleP2PSupplyDeltaUpdated(
  event: P2PSupplyDeltaUpdated
): void {
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyDelta = event.params._p2pSupplyDelta;
  market.save();
}

export function handleRepaid(event: Repaid): void {
  const market = getMarket(event.params._poolToken);

  _handleRepaid(
    event,
    getCompoundProtocol(event.address),
    market,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleSupplied(event: Supplied): void {
  const market = getMarket(event.params._poolToken);

  _handleSupplied(
    event,
    getCompoundProtocol(event.address),
    market,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateCompoundRewards(market);
}

export function handleSupplierPositionUpdated(
  event: SupplierPositionUpdated
): void {
  _handleSupplierPositionUpdated(
    event,
    getCompoundProtocol(event.address),
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleWithdrawn(event: Withdrawn): void {
  const market = getMarket(event.params._poolToken);

  _handleWithdrawn(
    event,
    getCompoundProtocol(event.address),
    market,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateCompoundRewards(market);
}

export function handleDefaultMaxGasForMatchingSet(
  event: DefaultMaxGasForMatchingSet
): void {
  const protocol = getCompoundProtocol(event.address);
  protocol._defaultMaxGasForMatchingWithdraw =
    event.params._defaultMaxGasForMatching.withdraw;
  protocol._defaultMaxGasForMatchingSupply =
    event.params._defaultMaxGasForMatching.supply;
  protocol._defaultMaxGasForMatchingBorrow =
    event.params._defaultMaxGasForMatching.borrow;
  protocol._defaultMaxGasForMatchingRepay =
    event.params._defaultMaxGasForMatching.repay;
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
  const protocol = getCompoundProtocol(event.address);
  protocol._maxSortedUsers = event.params._newValue;
  protocol.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const protocol = getCompoundProtocol(event.address);
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
  market._isSupplyPaused = event.params._newStatus;
  market._isBorrowPaused = event.params._newStatus;
  market.save();
}

export function handlePauseStatusSet(event: PauseStatusSet): void {
  const market = getMarket(event.params._poolToken);
  market._isSupplyPaused = event.params._newStatus;
  market._isBorrowPaused = event.params._newStatus;
  market._isRepayPaused = event.params._newStatus;
  market._isWithdrawPaused = event.params._newStatus;
  market._isLiquidateBorrowPaused = event.params._newStatus;
  market._isLiquidateCollateralPaused = event.params._newStatus;
  market.save();
}

export function handleReserveFactorSet(event: ReserveFactorSet): void {
  const market = getMarket(event.params._poolToken);
  market.reserveFactor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();
}

// Emitted when the treasury claims allocated tokens
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
export function handleReserveFeeClaimed(event: ReserveFeeClaimed): void {}

// Update $COMP distributed rewards
export function updateCompoundRewards(market: Market): void {
  // DEPOSIT first because it alphabetizes
  const rewardTokens = [
    getOrCreateRewardToken(COMP_ADDRESS, RewardTokenType.DEPOSIT).id,
    getOrCreateRewardToken(COMP_ADDRESS, RewardTokenType.VARIABLE_BORROW).id,
  ];
  const amounts = [BigInt.zero(), BigInt.zero()];
  const amountsUSD = [BigDecimal.zero(), BigDecimal.zero()];

  // get token amount in Compound market
  const cTokenContract = CToken.bind(Address.fromBytes(market.id));
  const tryCTokenAmount = cTokenContract.try_totalSupply();
  const tryBalanceOf = cTokenContract.try_balanceOf(MORPHO_COMPOUND_ADDRESS);
  if (tryCTokenAmount.reverted || tryBalanceOf.reverted) {
    log.error(
      "[updateCompoundRewards] cTokenContract.try_totalSupply() or cTokenContract.try_balanceOf(MORPHO_COMPOUND_ADDRESS) reverted for market: {}",
      [market.id.toHexString()]
    );
    return;
  }
  const morphoShare = tryBalanceOf.value
    .toBigDecimal()
    .div(tryCTokenAmount.value.toBigDecimal());

  // get COMP reward rate per side
  const comptrollerContract = Comptroller.bind(COMPTROLLER_ADDRESS);
  const trySupplySpeed = comptrollerContract.try_compSupplySpeeds(
    Address.fromBytes(market.id)
  );
  const tryBorrowSpeed = comptrollerContract.try_compBorrowSpeeds(
    Address.fromBytes(market.id)
  );

  if (trySupplySpeed.reverted || tryBorrowSpeed.reverted) {
    log.error(
      "[updateCompoundRewards] comptrollerContract.try_compSupplySpeeds(market.id) or comptrollerContract.try_compBorrowSpeeds(market.id) reverted for market: {}",
      [market.id.toHexString()]
    );
    return;
  }

  // get COMP price in USD
  const protocol = LendingProtocol.load(market.protocol);
  if (!protocol) {
    log.error("[updateCompoundRewards] protocol not found for protocol: {}", [
      market.protocol.toHexString(),
    ]);
    return;
  }
  let priceUSD = BigDecimal.zero();
  if (protocol._oracle) {
    const oracleContract = CompoundOracle.bind(
      Address.fromBytes(protocol._oracle!)
    );
    const tryPriceUSD = oracleContract.try_getUnderlyingPrice(CCOMP_ADDRESS);
    const bdFactor = exponentToBigDecimal(DEFAULT_DECIMALS);
    if (!tryPriceUSD.reverted) {
      priceUSD = tryPriceUSD.value.toBigDecimal().div(bdFactor);
    }
  }

  // set COMP rewards
  amounts[0] = BigInt.fromString(
    trySupplySpeed.value
      .toBigDecimal()
      .times(morphoShare)
      .times(BLOCKS_PER_DAY.toBigDecimal())
      .truncate(0)
      .toString()
  );
  amounts[1] = BigInt.fromString(
    tryBorrowSpeed.value
      .toBigDecimal()
      .times(morphoShare)
      .times(BLOCKS_PER_DAY.toBigDecimal())
      .truncate(0)
      .toString()
  );

  amountsUSD[0] = amounts[0]
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(priceUSD);
  amountsUSD[1] = amounts[1]
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(priceUSD);

  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = amounts;
  market.rewardTokenEmissionsUSD = amountsUSD;
  market.save();
}
