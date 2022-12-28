import {
  LoanCreated as LegacyLoanCreatedEvent,
  LoanClosed as LegacyLoanClosedEvent,
  LoanLiquidated as LegacyLoanLiquidatedEvent,
} from "../../generated/loans_EtherCollateral_0/EtherCollateral";

import {
  LoanPartiallyLiquidated as LegacyLoanPartiallyLiquidatedEvent,
  CollateralDeposited as LegacyCollateralDepositedEvent,
  CollateralWithdrawn as LegacyCollateralWithdrawnEvent,
  LoanRepaid as LegacyLoanRepaidEvent,
} from "../../generated/loans_EtherCollateralsUSD_0/EtherCollateralsUSD";

import {
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
  LoanClosedByLiquidation as LoanClosedByLiquidation,
  LoanPartiallyLiquidated as LoanPartiallyLiquidatedEvent,
  CollateralDeposited as CollateralDepositedEvent,
  CollateralWithdrawn as CollateralWithdrawnEvent,
  LoanRepaymentMade as LoanRepaymentMadeEvent,
  LoanDrawnDown as LoanDrawnDownEvent,
} from "../../generated/loans_CollateralEth_0/CollateralEth";

import {
  Loan,
  LoanLiquidated,
  LoanPartiallyLiquidated,
  CollateralDeposited,
  CollateralWithdrawn,
  LoanRepaid,
} from "../../generated/schema";

import { log, BigInt } from "@graphprotocol/graph-ts";
import { toDecimal } from "./lib/helpers";

export function handleLoanCreatedEther(event: LoanCreatedEvent): void {
  let loanEntity = new Loan(event.params.id.toHex() + "-sETH");
  loanEntity.txHash = event.transaction.hash.toHex();
  loanEntity.account = event.params.account;
  loanEntity.amount = toDecimal(event.params.amount);
  loanEntity.hasPartialLiquidations = false;
  loanEntity.isOpen = true;
  loanEntity.createdAt = event.block.timestamp;
  loanEntity.collateralMinted = "sETH";
  loanEntity.currency = event.params.currency.toString();
  loanEntity.collateralAmount = toDecimal(event.params.collateral);
  loanEntity.save();
}

export function handleLoanClosedEther(event: LoanClosedEvent): void {
  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");

  if (loanEntity) {
    loanEntity.isOpen = false;
    loanEntity.closedAt = event.block.timestamp;
    loanEntity.save();
  }
}

export function handleLoanClosedByLiquidation(
  event: LoanClosedByLiquidation
): void {
  let loanLiquidatedEntity = new LoanLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanLiquidatedEntity.loanId = event.params.id;
  loanLiquidatedEntity.account = event.params.account;
  loanLiquidatedEntity.liquidator = event.params.liquidator;
  loanLiquidatedEntity.timestamp = event.block.timestamp;
  loanLiquidatedEntity.save();

  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity) {
    loanEntity.isOpen = false;
    loanEntity.closedAt = event.block.timestamp;
    loanEntity.collateralAmount = toDecimal(BigInt.fromI32(0));
    loanEntity.save();
  }
}

export function handleLoanPartiallyLiquidated(
  event: LoanPartiallyLiquidatedEvent
): void {
  let loanPartiallyLiquidatedEntity = new LoanPartiallyLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanPartiallyLiquidatedEntity.loanId = event.params.id;
  loanPartiallyLiquidatedEntity.account = event.params.account;
  loanPartiallyLiquidatedEntity.liquidator = event.params.liquidator;
  loanPartiallyLiquidatedEntity.liquidatedAmount = toDecimal(
    event.params.amountLiquidated
  );
  loanPartiallyLiquidatedEntity.liquidatedCollateral = toDecimal(
    event.params.collateralLiquidated
  );
  loanPartiallyLiquidatedEntity.timestamp = event.block.timestamp;
  loanPartiallyLiquidatedEntity.save();

  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity == null) {
    log.error(
      "for handleLoanPartiallyLiquidated there should be a loan entity for this id: {} in this hash: {}",
      [event.params.id.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.hasPartialLiquidations = true;
  loanEntity.amount = loanEntity.amount.minus(
    toDecimal(event.params.amountLiquidated)
  );
  loanEntity.collateralAmount = loanEntity.collateralAmount.minus(
    toDecimal(event.params.collateralLiquidated)
  );
  loanEntity.save();
}

export function handleLoanRepaymentMade(event: LoanRepaymentMadeEvent): void {
  let loanRepaid = new LoanRepaid(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanRepaid.repaidAmount = toDecimal(event.params.amountRepaid);
  loanRepaid.newLoanAmount = toDecimal(event.params.amountAfter);
  loanRepaid.loanId = event.params.id;
  loanRepaid.account = event.params.account;
  loanRepaid.timestamp = event.block.timestamp;
  loanRepaid.save();

  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity == null) {
    log.error(
      "for handleLoanRepaid there should be a loan entity for this id: {} in this hash: {}",
      [event.params.id.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.amount = loanRepaid.newLoanAmount;
  loanEntity.save();
}

export function handleCollateralDeposited(
  event: CollateralDepositedEvent
): void {
  let collateralDepositedEntity = new CollateralDeposited(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  collateralDepositedEntity.collateralAmount = toDecimal(
    event.params.amountDeposited
  );
  collateralDepositedEntity.collateralAfter = toDecimal(
    event.params.collateralAfter
  );
  collateralDepositedEntity.loanId = event.params.id;
  collateralDepositedEntity.account = event.params.account;
  collateralDepositedEntity.timestamp = event.block.timestamp;
  collateralDepositedEntity.save();

  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity) {
    loanEntity.collateralAmount = collateralDepositedEntity.collateralAfter;
    loanEntity.save();
  }
}

export function handleCollateralWithdrawn(
  event: CollateralWithdrawnEvent
): void {
  let collateralWithdrawnEntity = new CollateralWithdrawn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  collateralWithdrawnEntity.amountWithdrawn = toDecimal(
    event.params.amountWithdrawn
  );
  collateralWithdrawnEntity.collateralAfter = toDecimal(
    event.params.collateralAfter
  );
  collateralWithdrawnEntity.loanId = event.params.id;
  collateralWithdrawnEntity.account = event.params.account;
  collateralWithdrawnEntity.timestamp = event.block.timestamp;
  collateralWithdrawnEntity.save();

  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity) {
    loanEntity.collateralAmount = collateralWithdrawnEntity.collateralAfter;
    loanEntity.save();
  }
}

export function handleLoanDrawnDown(event: LoanDrawnDownEvent): void {
  let loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity == null) {
    log.error(
      "for handleLoanPartiallyLiquidated there should be a loan entity for this id: {} in this hash: {}",
      [event.params.id.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.hasPartialLiquidations = true;
  loanEntity.amount = loanEntity.amount.plus(toDecimal(event.params.amount));
  loanEntity.save();
}

// LEGACY FUNCTIONS

function addLoanEntity(
  event: LegacyLoanCreatedEvent,
  collateralMinted: string
): Loan {
  let loanEntity = new Loan(
    event.params.loanID.toHex() + "-" + collateralMinted
  );
  loanEntity.txHash = event.transaction.hash.toHex();
  loanEntity.account = event.params.account;
  loanEntity.amount = toDecimal(event.params.amount);
  loanEntity.hasPartialLiquidations = false;
  loanEntity.isOpen = true;
  loanEntity.createdAt = event.block.timestamp;
  loanEntity.currency = "";
  loanEntity.collateralAmount = toDecimal(BigInt.fromI32(0));
  return loanEntity;
}

export function handleLoanCreatedEtherLegacy(
  event: LegacyLoanCreatedEvent
): void {
  let loanEntity = addLoanEntity(event, "sETH");
  loanEntity.collateralMinted = "sETH";
  loanEntity.save();
}

export function handleLoanCreatedsUSDLegacy(
  event: LegacyLoanCreatedEvent
): void {
  let loanEntity = addLoanEntity(event, "sUSD");
  loanEntity.collateralMinted = "sUSD";
  loanEntity.save();
}

function closeLoan(
  event: LegacyLoanClosedEvent,
  collateralMinted: string
): void {
  let loanEntity = Loan.load(
    event.params.loanID.toHex() + "-" + collateralMinted
  );

  if (loanEntity) {
    loanEntity.isOpen = false;
    loanEntity.closedAt = event.block.timestamp;
    loanEntity.save();
  }
}

export function handleLoanClosedEtherLegacy(
  event: LegacyLoanClosedEvent
): void {
  closeLoan(event, "sETH");
}

export function handleLoanClosedsUSDLegacy(event: LegacyLoanClosedEvent): void {
  closeLoan(event, "sUSD");
}

// NOTE no need to close the loan here as the LoanClosed event was emitted directly prior to this event
export function handleLoanLiquidatedLegacy(
  event: LegacyLoanLiquidatedEvent
): void {
  let loanLiquidatedEntity = new LoanLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanLiquidatedEntity.loanId = event.params.loanID;
  loanLiquidatedEntity.account = event.params.account;
  loanLiquidatedEntity.liquidator = event.params.liquidator;
  loanLiquidatedEntity.timestamp = event.block.timestamp;
  loanLiquidatedEntity.save();
}

export function handleLoanPartiallyLiquidatedLegacy(
  event: LegacyLoanPartiallyLiquidatedEvent
): void {
  let loanPartiallyLiquidatedEntity = new LoanPartiallyLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanPartiallyLiquidatedEntity.loanId = event.params.loanID;
  loanPartiallyLiquidatedEntity.account = event.params.account;
  loanPartiallyLiquidatedEntity.liquidator = event.params.liquidator;
  loanPartiallyLiquidatedEntity.liquidatedAmount = toDecimal(
    event.params.liquidatedAmount
  );
  loanPartiallyLiquidatedEntity.liquidatedCollateral = toDecimal(
    event.params.liquidatedCollateral
  );
  loanPartiallyLiquidatedEntity.timestamp = event.block.timestamp;
  loanPartiallyLiquidatedEntity.save();

  let loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error(
      "for handleLoanPartiallyLiquidated there should be a loan entity for this id: {} in this hash: {}",
      [event.params.loanID.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.hasPartialLiquidations = true;
  loanEntity.amount = loanEntity.amount.minus(
    toDecimal(event.params.liquidatedAmount)
  );
  loanEntity.save();
}

export function handleCollateralDepositedLegacy(
  event: LegacyCollateralDepositedEvent
): void {
  let collateralDepositedEntity = new CollateralDeposited(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  collateralDepositedEntity.collateralAmount = toDecimal(
    event.params.collateralAmount
  );
  collateralDepositedEntity.collateralAfter = toDecimal(
    event.params.collateralAfter
  );
  collateralDepositedEntity.loanId = event.params.loanID;
  collateralDepositedEntity.account = event.params.account;
  collateralDepositedEntity.timestamp = event.block.timestamp;
  collateralDepositedEntity.save();
}

export function handleCollateralWithdrawnLegacy(
  event: LegacyCollateralWithdrawnEvent
): void {
  let collateralWithdrawnEntity = new CollateralWithdrawn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  collateralWithdrawnEntity.amountWithdrawn = toDecimal(
    event.params.amountWithdrawn
  );
  collateralWithdrawnEntity.collateralAfter = toDecimal(
    event.params.collateralAfter
  );
  collateralWithdrawnEntity.loanId = event.params.loanID;
  collateralWithdrawnEntity.account = event.params.account;
  collateralWithdrawnEntity.timestamp = event.block.timestamp;
  collateralWithdrawnEntity.save();
}

export function handleLoanRepaidLegacy(event: LegacyLoanRepaidEvent): void {
  let loanRepaid = new LoanRepaid(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanRepaid.repaidAmount = toDecimal(event.params.repaidAmount);
  loanRepaid.newLoanAmount = toDecimal(event.params.newLoanAmount);
  loanRepaid.loanId = event.params.loanID;
  loanRepaid.account = event.params.account;
  loanRepaid.timestamp = event.block.timestamp;
  loanRepaid.save();

  let loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error(
      "for handleLoanRepaid there should be a loan entity for this id: {} in this hash: {}",
      [event.params.loanID.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.amount = loanRepaid.newLoanAmount;
  loanEntity.save();
}
