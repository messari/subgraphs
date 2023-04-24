import { BigInt } from "@graphprotocol/graph-ts";
import {
  P2PSupplyDeltaUpdated,
  Repaid,
  Supplied,
  SupplierPositionUpdated,
  Withdrawn,
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
  Liquidated,
  P2PAmountsUpdated,
  P2PBorrowDeltaUpdated,
  Borrowed,
  BorrowerPositionUpdated,
  P2PIndexesUpdated,
} from "../../../generated/Morpho/MorphoCompound";
import { BASE_UNITS } from "../../constants";
import { getMarket } from "../../utils/initializers";
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
import { fetchMorphoPositionsCompound, getCompoundProtocol } from "./fetchers";
export { handleMarketCreated } from "./handleMarketCreated";

export function handleP2PIndexesUpdated(event: P2PIndexesUpdated): void {
  const market = getMarket(event.params._poolToken);

  _handleP2PIndexesUpdated(
    event,
    getCompoundProtocol(event.address),
    fetchMorphoPositionsCompound(market),
    market,
    event.params._poolSupplyIndex,
    event.params._p2pSupplyIndex,
    event.params._poolBorrowIndex,
    event.params._p2pBorrowIndex
  );
}

export function handleBorrowed(event: Borrowed): void {
  const market = getMarket(event.params._poolToken);

  _handleBorrowed(
    event,
    getCompoundProtocol(event.address),
    fetchMorphoPositionsCompound(market),
    market,
    event.params._borrower,
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
    getCompoundProtocol(event.address),
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleLiquidated(event: Liquidated): void {
  _handleLiquidated(
    event,
    getCompoundProtocol(event.address),
    event.params._poolTokenCollateralAddress,
    event.params._poolTokenBorrowedAddress,
    event.params._liquidator,
    event.params._liquidated,
    event.params._amountSeized,
    event.params._amountRepaid
  );
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
    fetchMorphoPositionsCompound(market),
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
    fetchMorphoPositionsCompound(market),
    market,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
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
    fetchMorphoPositionsCompound(market),
    market,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
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
