import {
  AdminChanged as AdminChangedEvent,
  BeaconUpgraded as BeaconUpgradedEvent,
  ContractPausedSet as ContractPausedSetEvent,
  FunctionUnpausedSet as FunctionUnpausedSetEvent,
  Initialized as InitializedEvent,
  IsleVaultSet as IsleVaultSetEvent,
  ProtocolFeeSet as ProtocolFeeSetEvent,
  ProtocolPausedSet as ProtocolPausedSetEvent,
  TransferGovernor as TransferGovernorEvent,
  Upgraded as UpgradedEvent,
  ValidPoolAdminSet as ValidPoolAdminSetEvent,
  ValidPoolAssetSet as ValidPoolAssetSetEvent,
  ValidReceivableAssetSet as ValidReceivableAssetSetEvent,
} from "../../../generated/IsleGlobals/IsleGlobals";
import {
  AdminChanged,
  BeaconUpgraded,
  ContractPausedSet,
  FunctionUnpausedSet,
  Initialized,
  IsleVaultSet,
  ProtocolFeeSet,
  ProtocolPausedSet,
  TransferGovernor,
  Upgraded,
  ValidPoolAdminSet,
  ValidPoolAssetSet,
  ValidReceivableAssetSet,
} from "../../../generated/schema";

export function handleAdminChanged(event: AdminChangedEvent): void {
  let entity = new AdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.previousAdmin = event.params.previousAdmin;
  entity.newAdmin = event.params.newAdmin;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBeaconUpgraded(event: BeaconUpgradedEvent): void {
  let entity = new BeaconUpgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.beacon = event.params.beacon;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleContractPausedSet(event: ContractPausedSetEvent): void {
  let entity = new ContractPausedSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.caller_ = event.params.caller_;
  entity.contract_ = event.params.contract_;
  entity.contractPaused_ = event.params.contractPaused_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFunctionUnpausedSet(
  event: FunctionUnpausedSetEvent,
): void {
  let entity = new FunctionUnpausedSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.caller_ = event.params.caller_;
  entity.contract_ = event.params.contract_;
  entity.sig_ = event.params.sig_;
  entity.functionUnpaused_ = event.params.functionUnpaused_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleIsleVaultSet(event: IsleVaultSetEvent): void {
  let entity = new IsleVaultSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.previousIsleVault_ = event.params.previousIsleVault_;
  entity.currentIsleVault_ = event.params.currentIsleVault_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleProtocolFeeSet(event: ProtocolFeeSetEvent): void {
  let entity = new ProtocolFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.protocolFee_ = event.params.protocolFee_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleProtocolPausedSet(event: ProtocolPausedSetEvent): void {
  let entity = new ProtocolPausedSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.caller_ = event.params.caller_;
  entity.protocolPaused_ = event.params.protocolPaused_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransferGovernor(event: TransferGovernorEvent): void {
  let entity = new TransferGovernor(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.implementation = event.params.implementation;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleValidPoolAdminSet(event: ValidPoolAdminSetEvent): void {
  let entity = new ValidPoolAdminSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.poolAdmin_ = event.params.poolAdmin_;
  entity.isValid_ = event.params.isValid_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleValidPoolAssetSet(event: ValidPoolAssetSetEvent): void {
  let entity = new ValidPoolAssetSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.poolAsset_ = event.params.poolAsset_;
  entity.isValid_ = event.params.isValid_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleValidReceivableAssetSet(
  event: ValidReceivableAssetSetEvent,
): void {
  let entity = new ValidReceivableAssetSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.receivableAsset_ = event.params.receivableAsset_;
  entity.isValid_ = event.params.isValid_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
