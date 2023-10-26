import {
  AdminFeeSet as AdminFeeSetEvent,
  BaseRateSet as BaseRateSetEvent,
  BuyerSet as BuyerSetEvent,
  CoverDeposited as CoverDepositedEvent,
  CoverLiquidated as CoverLiquidatedEvent,
  CoverWithdrawn as CoverWithdrawnEvent,
  Initialized as InitializedEvent,
  MaxCoverLiquidationSet as MaxCoverLiquidationSetEvent,
  MinCoverSet as MinCoverSetEvent,
  OpenToPublicSet as OpenToPublicSetEvent,
  PoolLimitSet as PoolLimitSetEvent,
  RedeemProcessed as RedeemProcessedEvent,
  RedeemRequested as RedeemRequestedEvent,
  SharesRemoved as SharesRemovedEvent,
  TransferAdmin as TransferAdminEvent,
  ValidLenderSet as ValidLenderSetEvent,
  ValidSellerSet as ValidSellerSetEvent,
} from "../../../generated/PoolConfigurator/PoolConfigurator";
import {
  AdminFeeSet,
  BaseRateSet,
  BuyerSet,
  CoverDeposited,
  CoverLiquidated,
  CoverWithdrawn,
  Initialized,
  MaxCoverLiquidationSet,
  MinCoverSet,
  OpenToPublicSet,
  PoolLimitSet,
  RedeemProcessed,
  RedeemRequested,
  SharesRemoved,
  TransferAdmin,
  ValidLenderSet,
  ValidSellerSet,
} from "../../../generated/schema";

export function handleAdminFeeSet(event: AdminFeeSetEvent): void {
  let entity = new AdminFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.adminFee_ = event.params.adminFee_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBaseRateSet(event: BaseRateSetEvent): void {
  let entity = new BaseRateSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.baseRate_ = event.params.baseRate_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBuyerSet(event: BuyerSetEvent): void {
  let entity = new BuyerSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.buyer_ = event.params.buyer_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCoverDeposited(event: CoverDepositedEvent): void {
  let entity = new CoverDeposited(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.amount_ = event.params.amount_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCoverLiquidated(event: CoverLiquidatedEvent): void {
  let entity = new CoverLiquidated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.toPool_ = event.params.toPool_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCoverWithdrawn(event: CoverWithdrawnEvent): void {
  let entity = new CoverWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.amount_ = event.params.amount_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolAdmin_ = event.params.poolAdmin_;
  entity.asset_ = event.params.asset_;
  entity.pool_ = event.params.pool_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMaxCoverLiquidationSet(
  event: MaxCoverLiquidationSetEvent
): void {
  let entity = new MaxCoverLiquidationSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.maxCoverLiquidation_ = event.params.maxCoverLiquidation_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMinCoverSet(event: MinCoverSetEvent): void {
  let entity = new MinCoverSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minCover_ = event.params.minCover_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOpenToPublicSet(event: OpenToPublicSetEvent): void {
  let entity = new OpenToPublicSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.isOpenToPublic_ = event.params.isOpenToPublic_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePoolLimitSet(event: PoolLimitSetEvent): void {
  let entity = new PoolLimitSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolLimit_ = event.params.poolLimit_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRedeemProcessed(event: RedeemProcessedEvent): void {
  let entity = new RedeemProcessed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner_ = event.params.owner_;
  entity.redeemableShares_ = event.params.redeemableShares_;
  entity.resultingAssets_ = event.params.resultingAssets_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRedeemRequested(event: RedeemRequestedEvent): void {
  let entity = new RedeemRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner_ = event.params.owner_;
  entity.shares_ = event.params.shares_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleSharesRemoved(event: SharesRemovedEvent): void {
  let entity = new SharesRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner_ = event.params.owner_;
  entity.shares_ = event.params.shares_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransferAdmin(event: TransferAdminEvent): void {
  let entity = new TransferAdmin(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAdmin_ = event.params.oldAdmin_;
  entity.newAdmin_ = event.params.newAdmin_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleValidLenderSet(event: ValidLenderSetEvent): void {
  let entity = new ValidLenderSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.lender_ = event.params.lender_;
  entity.isValid_ = event.params.isValid_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleValidSellerSet(event: ValidSellerSetEvent): void {
  let entity = new ValidSellerSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.seller_ = event.params.seller_;
  entity.isValid_ = event.params.isValid_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
