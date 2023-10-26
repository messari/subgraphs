import {
  AccountingStateUpdated as AccountingStateUpdatedEvent,
  FeesPaid as FeesPaidEvent,
  FundsDistributed as FundsDistributedEvent,
  FundsWithdrawn as FundsWithdrawnEvent,
  ImpairmentRemoved as ImpairmentRemovedEvent,
  Initialized as InitializedEvent,
  IssuanceParamsUpdated as IssuanceParamsUpdatedEvent,
  LoanImpaired as LoanImpairedEvent,
  LoanRepaid as LoanRepaidEvent,
  LoanRequested as LoanRequestedEvent,
  PaymentAdded as PaymentAddedEvent,
  PaymentRemoved as PaymentRemovedEvent,
  PrincipalOutUpdated as PrincipalOutUpdatedEvent,
  UnrealizedLossesUpdated as UnrealizedLossesUpdatedEvent,
} from "../../../generated/LoanManager/LoanManager";
import {
  AccountingStateUpdated,
  FeesPaid,
  FundsDistributed,
  FundsWithdrawn,
  ImpairmentRemoved,
  Initialized,
  IssuanceParamsUpdated,
  LoanImpaired,
  LoanRepaid,
  LoanRequested,
  PaymentAdded,
  PaymentRemoved,
  PrincipalOutUpdated,
  UnrealizedLossesUpdated,
} from "../../../generated/schema";

export function handleAccountingStateUpdated(
  event: AccountingStateUpdatedEvent
): void {
  let entity = new AccountingStateUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.issuanceRate_ = event.params.issuanceRate_;
  entity.accountedInterest_ = event.params.accountedInterest_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFeesPaid(event: FeesPaidEvent): void {
  let entity = new FeesPaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.adminFee_ = event.params.adminFee_;
  entity.protocolFee_ = event.params.protocolFee_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFundsDistributed(event: FundsDistributedEvent): void {
  let entity = new FundsDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.principal_ = event.params.principal_;
  entity.netInterest_ = event.params.netInterest_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
  let entity = new FundsWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.amount_ = event.params.amount_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleImpairmentRemoved(event: ImpairmentRemovedEvent): void {
  let entity = new ImpairmentRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.originalPaymentDueDate_ = event.params.originalPaymentDueDate_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolAddressesProvider_ = event.params.poolAddressesProvider_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleIssuanceParamsUpdated(
  event: IssuanceParamsUpdatedEvent
): void {
  let entity = new IssuanceParamsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.domainEnd_ = event.params.domainEnd_;
  entity.issuanceRate_ = event.params.issuanceRate_;
  entity.accountedInterest_ = event.params.accountedInterest_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLoanImpaired(event: LoanImpairedEvent): void {
  let entity = new LoanImpaired(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.newDueDate_ = event.params.newDueDate_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let entity = new LoanRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.principal_ = event.params.principal_;
  entity.interest_ = event.params.interest_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLoanRequested(event: LoanRequestedEvent): void {
  let entity = new LoanRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePaymentAdded(event: PaymentAddedEvent): void {
  let entity = new PaymentAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.paymentId_ = event.params.paymentId_;
  entity.protocolFee_ = event.params.protocolFee_;
  entity.adminFee_ = event.params.adminFee_;
  entity.startDate_ = event.params.startDate_;
  entity.dueDate_ = event.params.dueDate_;
  entity.newRate_ = event.params.newRate_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePaymentRemoved(event: PaymentRemovedEvent): void {
  let entity = new PaymentRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.loanId_ = event.params.loanId_;
  entity.paymentId_ = event.params.paymentId_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePrincipalOutUpdated(
  event: PrincipalOutUpdatedEvent
): void {
  let entity = new PrincipalOutUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.principalOut_ = event.params.principalOut_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleUnrealizedLossesUpdated(
  event: UnrealizedLossesUpdatedEvent
): void {
  let entity = new UnrealizedLossesUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.unrealizedLosses_ = event.params.unrealizedLosses_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
