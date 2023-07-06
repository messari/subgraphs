import {
  _handleRepaid,
  _handleSupplied,
  _handleBorrowed,
  _handleWithdrawn,
  _handleLiquidated,
  _handleP2PIndexesUpdated,
  _handleBorrowerPositionUpdated,
  _handleSupplierPositionUpdated,
} from "../common";
import {
  Repaid,
  Borrowed,
  Supplied,
  Withdrawn,
  Liquidated,
  P2PStatusSet,
  PauseStatusSet,
  IsDeprecatedSet,
  IsRepayPausedSet,
  ReserveFactorSet,
  P2PAmountsUpdated,
  P2PIndexesUpdated,
  IsSupplyPausedSet,
  IsBorrowPausedSet,
  P2PIndexCursorSet,
  MaxSortedUsersSet,
  ReserveFeeClaimed,
  IsWithdrawPausedSet,
  OwnershipTransferred,
  P2PBorrowDeltaUpdated,
  P2PSupplyDeltaUpdated,
  PartialPauseStatusSet,
  BorrowerPositionUpdated,
  SupplierPositionUpdated,
  IsLiquidateBorrowPausedSet,
  DefaultMaxGasForMatchingSet,
  IsLiquidateCollateralPausedSet,
} from "../../../generated/Morpho/MorphoAaveV2";
import { getAaveProtocol } from "./fetchers";
import { BASE_UNITS } from "../../constants";
import { BigInt } from "@graphprotocol/graph-ts";
import { getMarket } from "../../utils/initializers";
import { AaveMath } from "../../utils/maths/aaveMath";
import { updateFinancials, updateP2PRates } from "../../helpers";

export { handleMarketCreated } from "./handleMarketCreated";

export function handleBorrowed(event: Borrowed): void {
  const protocol = getAaveProtocol(event.address);
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

export function handleP2PAmountsUpdated(event: P2PAmountsUpdated): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyAmount = event.params._p2pSupplyAmount;
  market._p2pBorrowAmount = event.params._p2pBorrowAmount;

  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PBorrowDeltaUpdated(
  event: P2PBorrowDeltaUpdated
): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._p2pBorrowDelta = event.params._p2pBorrowDelta;
  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PSupplyDeltaUpdated(
  event: P2PSupplyDeltaUpdated
): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._p2pSupplyDelta = event.params._p2pSupplyDelta;
  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleSupplied(event: Supplied): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);

  _handleSupplied(
    event,
    getAaveProtocol(event.address),
    market,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateFinancials(protocol, event.block);
}

export function handleBorrowerPositionUpdated(
  event: BorrowerPositionUpdated
): void {
  const protocol = getAaveProtocol(event.address);

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

export function handleSupplierPositionUpdated(
  event: SupplierPositionUpdated
): void {
  const protocol = getAaveProtocol(event.address);

  _handleSupplierPositionUpdated(
    event,
    protocol,
    event.params._poolToken,
    event.params._user,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );

  updateFinancials(protocol, event.block);
}

export function handleP2PIndexesUpdated(event: P2PIndexesUpdated): void {
  const protocol = getAaveProtocol(event.address);
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

export function handleLiquidated(event: Liquidated): void {
  const protocol = getAaveProtocol(event.address);

  _handleLiquidated(
    event,
    protocol,
    event.params._poolTokenCollateral,
    event.params._poolTokenBorrowed,
    event.params._liquidator,
    event.params._liquidated,
    event.params._amountSeized,
    event.params._amountRepaid
  );

  updateFinancials(protocol, event.block);
}

export function handleWithdrawn(event: Withdrawn): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);

  _handleWithdrawn(
    event,
    protocol,
    market,
    event.params._supplier,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
  updateFinancials(protocol, event.block);
}

export function handleRepaid(event: Repaid): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);

  _handleRepaid(
    event,
    protocol,
    market,
    event.params._onBehalf,
    event.params._amount,
    event.params._balanceOnPool,
    event.params._balanceInP2P
  );
  updateFinancials(protocol, event.block);
}

export function handleDefaultMaxGasForMatchingSet(
  event: DefaultMaxGasForMatchingSet
): void {
  const protocol = getAaveProtocol(event.address);
  protocol._defaultMaxGasForMatchingSupply =
    event.params._defaultMaxGasForMatching.supply;
  protocol._defaultMaxGasForMatchingBorrow =
    event.params._defaultMaxGasForMatching.borrow;
  protocol._defaultMaxGasForMatchingWithdraw =
    event.params._defaultMaxGasForMatching.withdraw;
  protocol._defaultMaxGasForMatchingRepay =
    event.params._defaultMaxGasForMatching.repay;
  protocol.save();

  updateFinancials(protocol, event.block);
}

export function handleIsBorrowPausedSet(event: IsBorrowPausedSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsDeprecatedSet(event: IsDeprecatedSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market.isActive = !event.params._isDeprecated;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsLiquidateBorrowPausedSet(
  event: IsLiquidateBorrowPausedSet
): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isLiquidateBorrowPaused = event.params._isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsLiquidateCollateralPausedSet(
  event: IsLiquidateCollateralPausedSet
): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isLiquidateCollateralPaused = event.params._isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsRepayPausedSet(event: IsRepayPausedSet): void {
  const market = getMarket(event.params._poolToken);
  market._isRepayPaused = event.params._isPaused;
  market.save();
}

export function handleIsSupplyPausedSet(event: IsSupplyPausedSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isSupplyPaused = event.params._isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsWithdrawPausedSet(event: IsWithdrawPausedSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isWithdrawPaused = event.params._isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleMaxSortedUsersSet(event: MaxSortedUsersSet): void {
  const protocol = getAaveProtocol(event.address);
  protocol._maxSortedUsers = event.params._newValue;
  protocol.save();

  updateFinancials(protocol, event.block);
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const protocol = getAaveProtocol(event.address);
  protocol._owner = event.params.newOwner;
  protocol.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PIndexCursorSet(event: P2PIndexCursorSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._p2pIndexCursor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PStatusSet(event: P2PStatusSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isP2PDisabled = event.params._isP2PDisabled;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handlePartialPauseStatusSet(
  event: PartialPauseStatusSet
): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._newStatus;
  market._isSupplyPaused = event.params._newStatus;

  market.save();

  updateFinancials(protocol, event.block);
}

export function handlePauseStatusSet(event: PauseStatusSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market._isBorrowPaused = event.params._newStatus;
  market._isSupplyPaused = event.params._newStatus;
  market._isWithdrawPaused = event.params._newStatus;
  market._isRepayPaused = event.params._newStatus;
  market.save();

  updateFinancials(protocol, event.block);
}
export function handleReserveFactorSet(event: ReserveFactorSet): void {
  const protocol = getAaveProtocol(event.address);
  const market = getMarket(event.params._poolToken);
  market.reserveFactor = BigInt.fromI32(event.params._newValue)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();

  updateFinancials(protocol, event.block);
}

// Reserve Fee Claimed is emitted when the treasury claims tokens allocated
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
export function handleReserveFeeClaimed(event: ReserveFeeClaimed): void {}
