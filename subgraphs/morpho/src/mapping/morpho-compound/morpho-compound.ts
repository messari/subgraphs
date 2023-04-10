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
  RewardsClaimed,
  RewardsClaimedAndTraded,
  Liquidated,
  P2PAmountsUpdated,
  P2PBorrowDeltaUpdated,
  Borrowed,
  BorrowerPositionUpdated,
  P2PIndexesUpdated,
} from "../../../generated/MorphoCompound/MorphoCompound";
import { BASE_UNITS } from "../../constants";
import { getMarket, getOrInitLendingProtocol } from "../../utils/initializers";
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

export { handleMarketCreated } from "./handleMarketCreated";
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

export function handleBorrowed(event: Borrowed): void {
  _handleBorrowed(
    event,
    event.params._poolToken,
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
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleLiquidated(event: Liquidated): void {
  _handleLiquidated(
    event,
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
  _handleRepaid(
    event,
    event.params._poolToken,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
}

export function handleSupplied(event: Supplied): void {
  _handleSupplied(
    event,
    event.params._poolToken,
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
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
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

export function handleDefaultMaxGasForMatchingSet(
  event: DefaultMaxGasForMatchingSet
): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol.defaultMaxGasForMatchingWithdraw =
    event.params._defaultMaxGasForMatching.withdraw;
  protocol.defaultMaxGasForMatchingSupply =
    event.params._defaultMaxGasForMatching.supply;
  protocol.defaultMaxGasForMatchingBorrow =
    event.params._defaultMaxGasForMatching.borrow;
  protocol.defaultMaxGasForMatchingRepay =
    event.params._defaultMaxGasForMatching.repay;
}

export function handleIsBorrowPausedSet(event: IsBorrowPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market.isBorrowPaused = event.params._isPaused;
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
  market.isLiquidateBorrowPaused = event.params._isPaused;
  market.save();
}

export function handleIsLiquidateCollateralPausedSet(
  event: IsLiquidateCollateralPausedSet
): void {
  const market = getMarket(event.params._poolToken);
  market.isLiquidateCollateralPaused = event.params._isPaused;
  market.save();
}

export function handleIsRepayPausedSet(event: IsRepayPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market.isRepayPaused = event.params._isPaused;
  market.save();
}

export function handleIsSupplyPausedSet(event: IsSupplyPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market.isSupplyPaused = event.params._isPaused;
  market.save();
}

export function handleIsWithdrawPausedSet(event: IsWithdrawPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market.isWithdrawPaused = event.params._isPaused;
  market.save();
}

export function handleMaxSortedUsersSet(event: MaxSortedUsersSet): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol.maxSortedUsers = event.params._newValue;
  protocol.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const protocol = getOrInitLendingProtocol(event.address);
  protocol.owner = event.params.newOwner;
  protocol.save();
}

export function handleP2PIndexCursorSet(event: P2PIndexCursorSet): void {
  const market = getMarket(event.params._poolToken);
  market.p2pIndexCursor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();
}

export function handleP2PStatusSet(event: P2PStatusSet): void {
  const market = getMarket(event.params._poolToken);
  market.isP2PDisabled = event.params._isP2PDisabled;
  market.save();
}

export function handlePartialPauseStatusSet(
  event: PartialPauseStatusSet
): void {
  const market = getMarket(event.params._poolToken);
  market.isSupplyPaused = event.params._newStatus;
  market.isBorrowPaused = event.params._newStatus;
  market.save();
}

export function handlePauseStatusSet(event: PauseStatusSet): void {
  const market = getMarket(event.params._poolToken);
  market.isSupplyPaused = event.params._newStatus;
  market.isBorrowPaused = event.params._newStatus;
  market.isRepayPaused = event.params._newStatus;
  market.isWithdrawPaused = event.params._newStatus;
  market.isLiquidateBorrowPaused = event.params._newStatus;
  market.isLiquidateCollateralPaused = event.params._newStatus;
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

export function handleRewardsClaimed(event: RewardsClaimed): void {}

export function handleRewardsClaimedAndTraded(
  event: RewardsClaimedAndTraded
): void {}
