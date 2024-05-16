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
  IsDeprecatedSet,
  IsP2PDisabledSet,
  IsRepayPausedSet,
  ReserveFactorSet,
  P2PTotalsUpdated,
  IndexesUpdated,
  IsSupplyPausedSet,
  IsBorrowPausedSet,
  P2PIndexCursorSet,
  ReserveFeeClaimed,
  IsWithdrawPausedSet,
  OwnershipTransferred,
  P2PBorrowDeltaUpdated,
  P2PSupplyDeltaUpdated,
  BorrowPositionUpdated,
  SupplyPositionUpdated,
  IsLiquidateBorrowPausedSet,
  IsLiquidateCollateralPausedSet,
} from "../../../generated/Morpho/MorphoAaveV3";
import { getAaveProtocol } from "./fetchers";
import { BASE_UNITS } from "../../constants";
import { getMarket } from "../../utils/initializers";
import { AaveMath } from "../../utils/maths/aaveMath";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { updateFinancials, updateP2PRates } from "../../helpers";
import { UnderlyingTokenMapping } from "../../../generated/schema";

export { handleMarketCreated } from "./handleMarketCreated";

export function handleBorrowed(event: Borrowed): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  _handleBorrowed(
    event,
    protocol,
    market,
    event.params.onBehalf,
    event.params.amount,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );

  updateFinancials(protocol, event.block);
}

export function handleP2PTotalsUpdated(event: P2PTotalsUpdated): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._p2pSupplyAmount = event.params.scaledTotalSupplyP2P;
  market._p2pBorrowAmount = event.params.scaledTotalBorrowP2P;

  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PBorrowDeltaUpdated(
  event: P2PBorrowDeltaUpdated,
): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._p2pBorrowDelta = event.params.scaledDelta;

  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleP2PSupplyDeltaUpdated(
  event: P2PSupplyDeltaUpdated,
): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._p2pSupplyDelta = event.params.scaledDelta;
  updateP2PRates(market, new AaveMath());
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleSupplied(event: Supplied): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  _handleSupplied(
    event,
    getAaveProtocol(event.address),
    market,
    event.params.onBehalf,
    event.params.amount,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );

  updateFinancials(protocol, event.block);
}

export function handleBorrowPositionUpdated(
  event: BorrowPositionUpdated,
): void {
  const protocol = getAaveProtocol(event.address);
  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;

  _handleBorrowerPositionUpdated(
    event,
    protocol,
    Address.fromBytes(tokenMapping.aToken),
    event.params.user,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );

  updateFinancials(protocol, event.block);
}

export function handleSupplyPositionUpdated(
  event: SupplyPositionUpdated,
): void {
  const protocol = getAaveProtocol(event.address);
  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;

  _handleSupplierPositionUpdated(
    event,
    protocol,
    Address.fromBytes(tokenMapping.aToken),
    event.params.user,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );

  updateFinancials(protocol, event.block);
}

export function handleIndexesUpdated(event: IndexesUpdated): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  _handleP2PIndexesUpdated(
    event,
    protocol,
    market,
    event.params.poolSupplyIndex,
    event.params.p2pSupplyIndex,
    event.params.poolBorrowIndex,
    event.params.p2pBorrowIndex,
  );

  updateFinancials(protocol, event.block);
}

export function handleLiquidated(event: Liquidated): void {
  const protocol = getAaveProtocol(event.address);

  const borrowerTokenMapping = UnderlyingTokenMapping.load(
    event.params.underlyingBorrowed,
  )!;
  const collateralTokenMapping = UnderlyingTokenMapping.load(
    event.params.underlyingCollateral,
  )!;

  _handleLiquidated(
    event,
    protocol,
    Address.fromBytes(collateralTokenMapping.aToken),
    Address.fromBytes(borrowerTokenMapping.aToken),
    event.params.liquidator,
    event.params.borrower,
    event.params.amountSeized,
    event.params.amountLiquidated,
  );

  updateFinancials(protocol, event.block);
}

export function handleWithdrawn(event: Withdrawn): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  _handleWithdrawn(
    event,
    protocol,
    market,
    event.params.onBehalf,
    event.params.amount,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );
  updateFinancials(protocol, event.block);
}

export function handleRepaid(event: Repaid): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  _handleRepaid(
    event,
    protocol,
    market,
    event.params.onBehalf,
    event.params.amount,
    event.params.scaledOnPool,
    event.params.scaledInP2P,
  );
  updateFinancials(protocol, event.block);
}

export function handleIsBorrowPausedSet(event: IsBorrowPausedSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isBorrowPaused = event.params.isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsDeprecatedSet(event: IsDeprecatedSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market.isActive = event.params.isDeprecated;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsLiquidateBorrowPausedSet(
  event: IsLiquidateBorrowPausedSet,
): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isLiquidateBorrowPaused = event.params.isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsLiquidateCollateralPausedSet(
  event: IsLiquidateCollateralPausedSet,
): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isLiquidateCollateralPaused = event.params.isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsRepayPausedSet(event: IsRepayPausedSet): void {
  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isRepayPaused = event.params.isPaused;
  market.save();
}

export function handleIsSupplyPausedSet(event: IsSupplyPausedSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isSupplyPaused = event.params.isPaused;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsWithdrawPausedSet(event: IsWithdrawPausedSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isWithdrawPaused = event.params.isPaused;
  market.save();

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

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._p2pIndexCursor = BigInt.fromI32(event.params.p2pIndexCursor)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleIsP2PDisabledSet(event: IsP2PDisabledSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market._isP2PDisabled = event.params.isP2PDisabled;
  market.save();

  updateFinancials(protocol, event.block);
}

export function handleReserveFactorSet(event: ReserveFactorSet): void {
  const protocol = getAaveProtocol(event.address);

  const tokenMapping = UnderlyingTokenMapping.load(event.params.underlying)!;
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market.reserveFactor = BigInt.fromI32(event.params.reserveFactor)
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();

  updateFinancials(protocol, event.block);
}

// Reserve Fee Claimed is emitted when the treasury claims tokens allocated
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
export function handleReserveFeeClaimed(event: ReserveFeeClaimed): void {}
