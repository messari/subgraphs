import {
  AdminChanged as AdminChangedEvent,
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  AssetBurned as AssetBurnedEvent,
  AssetCreated as AssetCreatedEvent,
  BeaconUpgraded as BeaconUpgradedEvent,
  Initialized as InitializedEvent,
  IsleGlobalsSet as IsleGlobalsSetEvent,
  Transfer as TransferEvent,
  TransferGovernor as TransferGovernorEvent,
  Upgraded as UpgradedEvent,
} from "../../../generated/Receivable/Receivable";
import {
  AdminChanged,
  Approval,
  ApprovalForAll,
  AssetBurned,
  AssetCreated,
  BeaconUpgraded,
  Initialized,
  IsleGlobalsSet,
  Transfer,
  TransferGovernor,
  Upgraded,
} from "../../../generated/schema";

export function handleAdminChanged(event: AdminChangedEvent): void {
  let entity = new AdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousAdmin = event.params.previousAdmin;
  entity.newAdmin = event.params.newAdmin;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner = event.params.owner;
  entity.approved = event.params.approved;
  entity.tokenId = event.params.tokenId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner = event.params.owner;
  entity.operator = event.params.operator;
  entity.approved = event.params.approved;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleAssetBurned(event: AssetBurnedEvent): void {
  let entity = new AssetBurned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tokenId_ = event.params.tokenId_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleAssetCreated(event: AssetCreatedEvent): void {
  let entity = new AssetCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.buyer_ = event.params.buyer_;
  entity.seller_ = event.params.seller_;
  entity.tokenId_ = event.params.tokenId_;
  entity.faceAmount_ = event.params.faceAmount_;
  entity.repaymentTimestamp_ = event.params.repaymentTimestamp_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBeaconUpgraded(event: BeaconUpgradedEvent): void {
  let entity = new BeaconUpgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.beacon = event.params.beacon;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.version = event.params.version;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleIsleGlobalsSet(event: IsleGlobalsSetEvent): void {
  let entity = new IsleGlobalsSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousIsleGlobals_ = event.params.previousIsleGlobals_;
  entity.currentIsleGlobals_ = event.params.currentIsleGlobals_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.tokenId = event.params.tokenId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransferGovernor(event: TransferGovernorEvent): void {
  let entity = new TransferGovernor(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldGovernor = event.params.oldGovernor;
  entity.newGovernor = event.params.newGovernor;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.implementation = event.params.implementation;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
