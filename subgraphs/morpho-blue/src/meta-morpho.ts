import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  AllocatorSet,
  FeeRecipient,
  MetaMorphoAllocator,
  MetaMorphoDeposit,
  MetaMorphoMarket,
  MetaMorphoPosition,
  MetaMorphoTransfer,
  MetaMorphoWithdraw,
  NewQueue,
  PendingCap,
  PendingGuardian,
  PendingTimelock,
} from "../generated/schema";
import {
  AccrueInterest as AccrueInterestEvent,
  Approval as ApprovalEvent,
  Deposit as DepositEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OwnershipTransferStarted as OwnershipTransferStartedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SetCap as SetCapEvent,
  SetCurator as SetCuratorEvent,
  SetFee as SetFeeEvent,
  SetFeeRecipient as SetFeeRecipientEvent,
  SetGuardian as SetGuardianEvent,
  SetIsAllocator as SetIsAllocatorEvent,
  SetSkimRecipient as SetSkimRecipientEvent,
  SetSupplyQueue as SetSupplyQueueEvent,
  SetTimelock as SetTimelockEvent,
  SetWithdrawQueue as SetWithdrawQueueEvent,
  SubmitCap as SubmitCapEvent,
  SubmitGuardian as SubmitGuardianEvent,
  SubmitTimelock as SubmitTimelockEvent,
  Transfer as TransferEvent,
  Skim as SkimEvent,
  UpdateLastTotalAssets as UpdateLastTotalAssetsEvent,
  Withdraw as WithdrawEvent,
  RevokePendingCap as RevokePendingCapEvent,
  SubmitMarketRemoval as SubmitMarketRemovalEvent,
  RevokePendingGuardian as RevokePendingGuardianEvent,
  RevokePendingMarketRemoval as RevokePendingMarketRemovalEvent,
  RevokePendingTimelock as RevokePendingTimelockEvent,
  ReallocateSupply as ReallocateSupplyEvent,
  ReallocateWithdraw as ReallocateWithdrawEvent,
} from "../generated/templates/MetaMorpho/MetaMorpho";

import { AccountManager } from "./sdk/account";
import {
  loadMetaMorpho,
  loadMetaMorphoMarket,
  loadMetaMorphoMarketFromId,
  PendingValueStatus,
  QueueType,
  updateMMRate,
} from "./sdk/metamorpho";
import { TokenManager } from "./sdk/token";
import { toMetaMorphoAssetsUp } from "./utils/metaMorphoUtils";

export function handleSubmitMarketRemoval(
  event: SubmitMarketRemovalEvent
): void {
  const mm = loadMetaMorpho(event.address);
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);

  mmMarket.removableAt = event.block.timestamp.plus(mm.timelock);
  mmMarket.save();
  // TODO: add pending removal entity
}
export function handleRevokePendingMarketRemoval(
  event: RevokePendingMarketRemovalEvent
): void {
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);
  mmMarket.removableAt = BigInt.zero();
  mmMarket.save();
}

export function handleReallocateWithdraw(
  event: ReallocateWithdrawEvent
): void {}

export function handleReallocateSupply(event: ReallocateSupplyEvent): void {}

export function handleSkim(event: SkimEvent): void {}

export function handleAccrueInterest(event: AccrueInterestEvent): void {
  const mm = loadMetaMorpho(event.address);

  mm.lastTotalAssets = event.params.newTotalAssets;
  mm.save();

  if (event.params.feeShares.isZero()) return;

  mm.feeAccrued = mm.feeAccrued.plus(event.params.feeShares);
  const token = new TokenManager(mm.asset, event);
  // Convert to assets
  const feeAssets = toMetaMorphoAssetsUp(
    event.params.feeShares,
    mm.totalShares,
    mm.lastTotalAssets,
    token.getDecimals() as u8
  );
  mm.feeAccruedAssets = mm.feeAccruedAssets.plus(feeAssets);
  mm.save();

  if (!mm.feeRecipient) {
    log.critical("MetaMorpho {} has no fee recipient", [
      event.address.toHexString(),
    ]);
    return;
  }
  const feeRecipient = FeeRecipient.load(mm.feeRecipient!);
  if (!feeRecipient) {
    log.critical("FeeRecipient {} not found", [mm.feeRecipient!.toHexString()]);
    return;
  }
  feeRecipient.feeAccrued = feeRecipient.feeAccrued.plus(
    event.params.feeShares
  );
  feeRecipient.feeAccruedAssets = feeRecipient.feeAccruedAssets.plus(feeAssets);
  feeRecipient.save();
  const positionId = event.address.concat(feeRecipient.account);
  let position = MetaMorphoPosition.load(positionId);
  if (!position) {
    position = new MetaMorphoPosition(positionId);
    position.metaMorpho = mm.id;
    position.account = feeRecipient.account;
    position.shares = BigInt.zero();
    position.lastAssetsBalance = BigInt.zero();
  }
  position.lastAssetsBalance = position.lastAssetsBalance.plus(feeAssets);
  position.lastAssetsBalanceUSD = new TokenManager(
    mm.asset,
    event
  ).getAmountUSD(position.lastAssetsBalance);
  position.shares = position.shares.plus(event.params.feeShares);
  position.save();
}

export function handleApproval(event: ApprovalEvent): void {}

export function handleDeposit(event: DepositEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.totalShares = mm.totalShares.plus(event.params.shares);
  mm.save();

  const positionID = event.address.concat(event.params.owner);
  let position = MetaMorphoPosition.load(positionID);
  if (!position) {
    position = new MetaMorphoPosition(positionID);
    position.metaMorpho = mm.id;
    position.account = new AccountManager(event.params.owner).getAccount().id;
    position.shares = BigInt.zero();
  }
  position.shares = position.shares.plus(event.params.shares);

  position.lastAssetsBalance = event.params.assets;

  const token = new TokenManager(mm.asset, event);
  position.lastAssetsBalanceUSD = token.getAmountUSD(event.params.assets);

  position.save();

  const deposit = new MetaMorphoDeposit(
    event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  deposit.hash = event.transaction.hash;
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.gasPrice = event.transaction.gasPrice;
  deposit.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  deposit.gasLimit = event.transaction.gasLimit;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = position.account;
  deposit.accountActor = new AccountManager(
    event.params.sender
  ).getAccount().id;
  deposit.asset = mm.asset;
  deposit.amount = event.params.assets;
  deposit.amountUSD = token.getAmountUSD(event.params.assets);
  deposit.shares = event.params.shares;
  deposit.metaMorpho = mm.id;
  deposit.metaMorphoPosition = position.id;
  deposit.save();
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent
): void {}

export function handleOwnershipTransferStarted(
  event: OwnershipTransferStartedEvent
): void {
  // TODO: use pending owner entity
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  const mm = loadMetaMorpho(event.address);
  mm.owner = event.params.newOwner;
  mm.save();
}

export function handleRevokePendingCap(event: RevokePendingCapEvent): void {
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);

  if (!mmMarket.currentPendingCap) {
    log.warning("MetaMorphoMarket {} has no pending cap", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingCap = PendingCap.load(mmMarket.currentPendingCap!);
  if (!pendingCap) {
    log.critical("PendingCap {} not found", [
      mmMarket.currentPendingCap!.toHexString(),
    ]);
    return;
  }

  pendingCap.status = PendingValueStatus.REJECTED;
  pendingCap.save();

  mmMarket.currentPendingCap = null;
  mmMarket.save();
}

export function handleRevokePendingGuardian(
  event: RevokePendingGuardianEvent
): void {
  const mm = loadMetaMorpho(event.address);
  if (!mm.currentPendingGuardian) {
    log.warning("MetaMorpho {} has no pending guardian", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingGuardian = PendingGuardian.load(mm.currentPendingGuardian!);
  if (!pendingGuardian) {
    log.critical("PendingGuardian {} not found", [
      mm.currentPendingGuardian!.toHexString(),
    ]);
    return;
  }
  pendingGuardian.status = PendingValueStatus.REJECTED;
  pendingGuardian.save();

  mm.currentPendingGuardian = null;
  mm.save();
}

export function handleRevokePendingTimelock(
  event: RevokePendingTimelockEvent
): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingTimelock === null) {
    log.warning("MetaMorpho {} has no pending timelock", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingTimelock = PendingTimelock.load(mm.currentPendingTimelock!);
  if (pendingTimelock === null) {
    log.critical("PendingTimelock {} not found", [
      mm.currentPendingTimelock!.toHexString(),
    ]);
    return;
  }
  pendingTimelock.status = PendingValueStatus.REJECTED;
  pendingTimelock.save();

  mm.currentPendingTimelock = null;
  mm.save();
}

export function handleSetCap(event: SetCapEvent): void {
  const mm = loadMetaMorpho(event.address);
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);

  if (event.params.cap.gt(BigInt.zero()) && !mmMarket.isInWithdrawQueue) {
    const supplyQueue = mm.supplyQueue;
    supplyQueue.push(mmMarket.id);
    const withdrawQueue = mm.withdrawQueue;
    withdrawQueue.push(mmMarket.id);

    mm.supplyQueue = supplyQueue;
    mm.withdrawQueue = withdrawQueue;

    mm.save();
    mmMarket.removableAt = BigInt.zero();
    mmMarket.isInSupplyQueue = true;
    mmMarket.isInWithdrawQueue = true;
    mmMarket.enabled = true;
    mmMarket.save();
  }

  mmMarket.cap = event.params.cap;
  if (mmMarket.currentPendingCap) {
    const pendingCap = PendingCap.load(mmMarket.currentPendingCap!);
    if (!pendingCap) {
      log.critical("PendingCap {} not found", [
        mmMarket.currentPendingCap!.toHexString(),
      ]);
      return;
    }
    pendingCap.status = pendingCap.cap.equals(event.params.cap)
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;

    pendingCap.save();
    mmMarket.currentPendingCap = null;
  }
  mmMarket.save();
}

export function handleSetCurator(event: SetCuratorEvent): void {
  const mm = loadMetaMorpho(event.address);
  const curator = new AccountManager(event.params.newCurator).getAccount();
  mm.curator = curator.id;
  mm.save();
}

export function handleSetFee(event: SetFeeEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.fee = event.params.newFee;
  mm.save();
}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {
  const mm = loadMetaMorpho(event.address);
  const currentFeeRecipient = mm.feeRecipient
    ? FeeRecipient.load(mm.feeRecipient!)
    : null;
  if (currentFeeRecipient) {
    currentFeeRecipient.isCurrentFeeRecipient = false;
    currentFeeRecipient.save();
  }
  let feeRecipient = FeeRecipient.load(event.params.newFeeRecipient);
  if (!feeRecipient) {
    feeRecipient = new FeeRecipient(event.params.newFeeRecipient);
    feeRecipient.account = new AccountManager(
      event.params.newFeeRecipient
    ).getAccount().id;
    feeRecipient.isCurrentFeeRecipient = true;
    feeRecipient.metaMorpho = mm.id;
    feeRecipient.feeAccrued = BigInt.zero();
    feeRecipient.feeAccruedAssets = BigInt.zero();
    feeRecipient.save();
  }
  mm.feeRecipient = feeRecipient.id;
  mm.save();
}

export function handleSetGuardian(event: SetGuardianEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingGuardian) {
    const pendingGuardian = PendingGuardian.load(mm.currentPendingGuardian!);
    if (!pendingGuardian) {
      log.critical("PendingGuardian {} not found", [
        mm.currentPendingGuardian!.toHexString(),
      ]);
      return;
    }
    pendingGuardian.status = pendingGuardian.guardian.equals(
      event.params.guardian
    )
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;
    pendingGuardian.save();
    mm.currentPendingGuardian = null;
  }
  mm.guardian = event.params.guardian;
  mm.save();
}

export function handleSetIsAllocator(event: SetIsAllocatorEvent): void {
  const mm = loadMetaMorpho(event.address);

  const allocatorId = event.params.allocator.concat(event.address);
  let allocator = MetaMorphoAllocator.load(allocatorId);
  if (!allocator) {
    allocator = new MetaMorphoAllocator(allocatorId);
    allocator.account = new AccountManager(
      event.params.allocator
    ).getAccount().id;
    allocator.metaMorpho = mm.id;
  }
  allocator.isCurrentAllocator = event.params.isAllocator;
  allocator.save();

  const allocatorSet = new AllocatorSet(
    event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  allocatorSet.hash = event.transaction.hash;
  allocatorSet.nonce = event.transaction.nonce;
  allocatorSet.logIndex = event.logIndex.toI32();
  allocatorSet.gasPrice = event.transaction.gasPrice;
  allocatorSet.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  allocatorSet.gasLimit = event.transaction.gasLimit;
  allocatorSet.blockNumber = event.block.number;
  allocatorSet.timestamp = event.block.timestamp;
  allocatorSet.accountActor = new AccountManager(mm.owner).getAccount().id;
  allocatorSet.metaMorpho = mm.id;
  allocatorSet.isAllocator = event.params.isAllocator;
  allocatorSet.allocator = allocator.id;

  allocatorSet.save();
}

export function handleSetSkimRecipient(event: SetSkimRecipientEvent): void {}

export function handleSetSupplyQueue(event: SetSupplyQueueEvent): void {
  // Supply queue on subgraph is a list of MetaMorphoMarket ids, not Market ids.
  const mm = loadMetaMorpho(event.address);
  const newSupplyQueue: Array<Bytes> = [];
  const addedMarkets: Array<Bytes> = [];
  const seen = new Map<Bytes, boolean>();
  for (let i = 0; i < event.params.newSupplyQueue.length; i++) {
    const mmMarket = loadMetaMorphoMarket(
      event.address,
      // The event contains a list of market ids, not MetaMorphoMarket ids
      event.params.newSupplyQueue[i]
    );
    if (!mmMarket.isInSupplyQueue) {
      addedMarkets.push(mmMarket.id);
      mmMarket.isInSupplyQueue = true;
      mmMarket.save();
    }
    seen.set(mmMarket.id, true);
    newSupplyQueue.push(mmMarket.id);
  }
  const removedMarkets: Array<Bytes> = [];
  for (let i = 0; i < mm.supplyQueue.length; i++) {
    if (!seen.has(mm.supplyQueue[i])) {
      const mmMarket = loadMetaMorphoMarketFromId(mm.supplyQueue[i]);
      mmMarket.isInSupplyQueue = false;
      mmMarket.save();
      removedMarkets.push(mmMarket.id);
    }
  }
  const newQueue = new NewQueue(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  newQueue.queueType = QueueType.SUPPLY_QUEUE;
  newQueue.caller = new AccountManager(event.params.caller).getAccount().id;
  newQueue.metaMorpho = mm.id;
  newQueue.submittedAt = event.block.timestamp;
  newQueue.removedMarkets = removedMarkets;
  newQueue.previousQueue = mm.supplyQueue;
  newQueue.newQueue = newSupplyQueue;
  newQueue.addedMarkets = addedMarkets;
  newQueue.save();

  mm.supplyQueue = newSupplyQueue;
  mm.save();
}

export function handleSetTimelock(event: SetTimelockEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingTimelock) {
    const pendingTimelock = PendingTimelock.load(mm.currentPendingTimelock!);
    if (!pendingTimelock) {
      log.critical("PendingTimelock {} not found", [
        mm.currentPendingTimelock!.toHexString(),
      ]);
      return;
    }
    pendingTimelock.status = pendingTimelock.timelock.equals(
      event.params.newTimelock
    )
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;

    pendingTimelock.save();
    mm.currentPendingTimelock = null;
  }
  mm.timelock = event.params.newTimelock;
  mm.save();
}

export function handleSetWithdrawQueue(event: SetWithdrawQueueEvent): void {
  // Withdraw queue on subgraph is a list of MetaMorphoMarket ids, not Market ids.
  const mm = loadMetaMorpho(event.address);
  const newWithdrawQueue: Array<Bytes> = [];
  const seen = new Map<Bytes, boolean>();
  for (let i = 0; i < event.params.newWithdrawQueue.length; i++) {
    const mmMarket = loadMetaMorphoMarket(
      event.address,
      // The event contains a list of market ids, not MetaMorphoMarket ids
      event.params.newWithdrawQueue[i]
    );
    seen.set(mmMarket.id, true);
    newWithdrawQueue.push(mmMarket.id);
  }
  const removedMarkets: Array<Bytes> = [];
  for (let i = 0; i < mm.withdrawQueue.length; i++) {
    if (!seen.has(mm.withdrawQueue[i])) {
      // TODO: we can add a check that the supply on the market is 0
      const mmMarket = loadMetaMorphoMarketFromId(mm.withdrawQueue[i]);
      mmMarket.enabled = false;
      mmMarket.isInWithdrawQueue = false;
      mmMarket.save();
      removedMarkets.push(mmMarket.id);
    }
  }
  const newQueue = new NewQueue(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  newQueue.queueType = QueueType.WITHDRAW_QUEUE;
  newQueue.caller = new AccountManager(event.params.caller).getAccount().id;
  newQueue.metaMorpho = mm.id;
  newQueue.submittedAt = event.block.timestamp;
  newQueue.removedMarkets = removedMarkets;
  newQueue.previousQueue = mm.withdrawQueue;
  newQueue.newQueue = newWithdrawQueue;
  newQueue.addedMarkets = []; // cannot add markets to the withdraw queue
  newQueue.save();

  mm.withdrawQueue = newWithdrawQueue;
  mm.save();
}

export function handleSubmitCap(event: SubmitCapEvent): void {
  const mm = loadMetaMorpho(event.address);
  const id = event.address
    .concat(event.params.id)
    .concat(Bytes.fromHexString(event.block.timestamp.toHexString()))
    .concat(Bytes.fromI32(event.logIndex.toI32()))
    .concat(Bytes.fromI32(event.transactionLogIndex.toI32()));

  const pendingCap = new PendingCap(id);
  pendingCap.metaMorpho = mm.id;
  pendingCap.cap = event.params.cap;

  const mmMarketId = event.address.concat(event.params.id);
  let metaMorphoMarket = MetaMorphoMarket.load(mmMarketId);

  pendingCap.isNewMarket =
    !metaMorphoMarket || metaMorphoMarket.cap === BigInt.zero();

  pendingCap.validAt = event.block.timestamp.plus(mm.timelock);
  pendingCap.submittedAt = event.block.timestamp;
  pendingCap.status = "PENDING";
  pendingCap.metaMorphoMarket = mmMarketId;
  pendingCap.save();

  if (!metaMorphoMarket) {
    // This is the only way to create a new MetaMorphoMarket
    metaMorphoMarket = new MetaMorphoMarket(mmMarketId);
    metaMorphoMarket.metaMorpho = mm.id;
    metaMorphoMarket.cap = BigInt.zero();
    metaMorphoMarket.removableAt = BigInt.zero();
    metaMorphoMarket.market = event.params.id;
    metaMorphoMarket.enabled = false;
    metaMorphoMarket.isInSupplyQueue = false;
    metaMorphoMarket.isInWithdrawQueue = false;
  }
  metaMorphoMarket.currentPendingCap = pendingCap.id;
  metaMorphoMarket.save();
}

export function handleSubmitGuardian(event: SubmitGuardianEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingGuardian) {
    log.critical("MetaMorpho {} already has a pending guardian", [
      event.address.toHexString(),
    ]);
    return;
  }
  const id = event.address
    .concat(Bytes.fromHexString(event.block.timestamp.toHexString()))
    .concat(Bytes.fromI32(event.logIndex.toI32()))
    .concat(Bytes.fromI32(event.transactionLogIndex.toI32()));

  const pendingGuardian = new PendingGuardian(id);
  pendingGuardian.metaMorpho = mm.id;
  pendingGuardian.guardian = new AccountManager(
    event.params.newGuardian
  ).getAccount().id;
  pendingGuardian.submittedAt = event.block.timestamp;
  pendingGuardian.validAt = event.block.timestamp.plus(mm.timelock);
  pendingGuardian.status = PendingValueStatus.PENDING;
  pendingGuardian.save();

  mm.currentPendingGuardian = pendingGuardian.id;
  mm.save();
}

export function handleSubmitTimelock(event: SubmitTimelockEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingTimelock) {
    const prevPendingTimelock = PendingTimelock.load(
      mm.currentPendingTimelock!
    )!;
    if (!prevPendingTimelock) {
      log.critical("PendingTimelock {} not found", [
        mm.currentPendingTimelock!.toHexString(),
      ]);
      return;
    }
    prevPendingTimelock.status = PendingValueStatus.REJECTED;
    prevPendingTimelock.save();
  }
  const pendingTimelock = new PendingTimelock(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  pendingTimelock.timelock = event.params.newTimelock;
  pendingTimelock.metaMorpho = mm.id;
  pendingTimelock.submittedAt = event.block.timestamp;
  pendingTimelock.validAt = event.block.timestamp.plus(mm.timelock);
  pendingTimelock.status = PendingValueStatus.PENDING;
  pendingTimelock.save();

  mm.currentPendingTimelock = pendingTimelock.id;
  mm.save();
}

export function handleTransfer(event: TransferEvent): void {
  // each deposit / withdraw is emitting a transfer event
  updateMMRate(event.address);
  if (
    event.params.from.equals(Address.zero()) ||
    event.params.to.equals(Address.zero())
  ) {
    // mint / burn transfer
    return;
  }
  const mm = loadMetaMorpho(event.address);
  const fromPositionID = event.address.concat(event.params.from);
  const fromPosition = MetaMorphoPosition.load(fromPositionID);
  if (!fromPosition) {
    log.critical("MetaMorphoPosition {} not found", [
      fromPositionID.toHexString(),
    ]);
    return;
  }
  const token = new TokenManager(mm.asset, event);
  fromPosition.shares = fromPosition.shares.minus(event.params.value);
  const fromAssets = toMetaMorphoAssetsUp(
    fromPosition.shares,
    mm.totalShares,
    mm.lastTotalAssets,
    token.getDecimals() as u8
  );
  fromPosition.lastAssetsBalance = fromAssets;
  fromPosition.lastAssetsBalanceUSD = token.getAmountUSD(fromAssets);
  fromPosition.save();

  const toPositionID = event.address.concat(event.params.to);
  let toPosition = MetaMorphoPosition.load(toPositionID);
  if (!toPosition) {
    toPosition = new MetaMorphoPosition(toPositionID);
    toPosition.metaMorpho = mm.id;
    toPosition.account = new AccountManager(event.params.to).getAccount().id;
    toPosition.shares = BigInt.zero();
  }
  toPosition.shares = toPosition.shares.plus(event.params.value);
  toPosition.lastAssetsBalance = fromAssets;
  toPosition.lastAssetsBalanceUSD = token.getAmountUSD(fromAssets);
  toPosition.save();

  const transfer = new MetaMorphoTransfer(
    event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  transfer.hash = event.transaction.hash;
  transfer.nonce = event.transaction.nonce;
  transfer.logIndex = event.logIndex.toI32();
  transfer.gasPrice = event.transaction.gasPrice;
  transfer.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  transfer.gasLimit = event.transaction.gasLimit;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.from = fromPosition.account;
  transfer.to = toPosition.account;
  transfer.shares = event.params.value;
  transfer.amount = fromAssets;
  transfer.amountUSD = token.getAmountUSD(fromAssets);

  transfer.metaMorphoPositionFrom = fromPosition.id;
  transfer.metaMorphoPositionTo = toPosition.id;
  transfer.metaMorpho = mm.id;
  transfer.save();
}

export function handleTransferRewards(event: SkimEvent): void {}

export function handleUpdateLastTotalAssets(
  event: UpdateLastTotalAssetsEvent
): void {
  const mm = loadMetaMorpho(event.address);
  mm.lastTotalAssets = event.params.updatedTotalAssets;
  mm.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.totalShares = mm.totalShares.minus(event.params.shares);
  mm.save();

  const positionID = event.address.concat(event.params.owner);
  const position = MetaMorphoPosition.load(positionID);
  if (!position) {
    log.critical("MetaMorphoPosition {} not found", [positionID.toHexString()]);
    return;
  }
  position.shares = position.shares.minus(event.params.shares);
  const asset = new TokenManager(mm.asset, event);
  const totalAssets = toMetaMorphoAssetsUp(
    position.shares,
    mm.totalShares,
    mm.lastTotalAssets,
    asset.getDecimals() as u8
  );
  position.lastAssetsBalance = totalAssets;
  position.lastAssetsBalanceUSD = asset.getAmountUSD(totalAssets);
  position.save();

  const withdraw = new MetaMorphoWithdraw(
    event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  withdraw.hash = event.transaction.hash;
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.gasPrice = event.transaction.gasPrice;
  withdraw.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  withdraw.gasLimit = event.transaction.gasLimit;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = position.account;
  withdraw.accountActor = new AccountManager(
    event.params.sender
  ).getAccount().id;
  withdraw.asset = mm.asset;
  withdraw.amount = event.params.assets;
  withdraw.amountUSD = asset.getAmountUSD(event.params.assets);
  withdraw.shares = event.params.shares;
  withdraw.metaMorpho = mm.id;
  withdraw.metaMorphoPosition = position.id;
  withdraw.save();
}
