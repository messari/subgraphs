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
import { bigDecimalToBigInt, getLatestRate, toDecimal } from "./lib/helpers";
import { ETH_ADDRESS, sETH_ADDRESS, sUSD_ADDRESS } from "../utils/constants";
import {
  createDeposit,
  createBorrow,
  createRepay,
  createWithdraw,
  createLiquidate,
} from "../entities/event";
import { getOrCreateMarket, addMarketTokenBalance } from "../entities/market";
import { getOrCreateToken } from "../entities/token";

// Input token for each and every function is eth, output can be sETH or sUSD,
// we need to know the collateralMinted
export function handleLoanCreatedEther(event: LoanCreatedEvent): void {
  const loanEntity = new Loan(event.params.id.toHex() + "-sETH");
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

  // We are depositing ETH and borrowing sETH
  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const latestRate = getLatestRate("sETH", txHash);

  const depositToken = getOrCreateToken(ETH_ADDRESS);
  const depositAmount = event.transaction.value;
  const depositUSD = toDecimal(depositAmount).times(latestRate!);

  const borrowAmount = event.params.amount;
  const borrowUSD = toDecimal(borrowAmount).times(latestRate!);
  // Get sETH rate here
  const market = getOrCreateMarket(depositToken.id, event);

  createDeposit(
    event,
    market,
    depositToken,
    depositAmount,
    depositUSD,
    address
  );
  createBorrow(
    event,
    market,
    getOrCreateToken(sETH_ADDRESS),
    borrowAmount,
    borrowUSD,
    address
  );
  addMarketTokenBalance(event, market, depositAmount, latestRate!);
}

export function handleLoanClosedEther(event: LoanClosedEvent): void {
  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");

  if (loanEntity) {
    loanEntity.isOpen = false;
    loanEntity.closedAt = event.block.timestamp;
    loanEntity.save();
  }
}

export function handleLoanClosedByLiquidation(
  event: LoanClosedByLiquidation
): void {
  const loanLiquidatedEntity = new LoanLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanLiquidatedEntity.loanId = event.params.id;
  loanLiquidatedEntity.account = event.params.account;
  loanLiquidatedEntity.liquidator = event.params.liquidator;
  loanLiquidatedEntity.timestamp = event.block.timestamp;
  loanLiquidatedEntity.save();

  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity == null) {
    log.error(
      "for handleLoanClosedByLiquidation there should be a loan entity for this id: {} in this hash: {}",
      [event.params.id.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }

  const address = event.params.account;

  const liquidator = event.params.liquidator;
  const eth = getOrCreateToken(ETH_ADDRESS);
  const eth_latestRate = getLatestRate("sETH", event.transaction.hash.toHex());
  const eth_amount = loanEntity.collateralAmount;
  const eth_amountUSD = eth_amount.times(eth_latestRate!);
  const market = getOrCreateMarket(eth.id, event);

  const susd = getOrCreateToken(sUSD_ADDRESS);
  const susd_latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const susd_amount = loanEntity.amount;
  const susd_amountUSD = susd_amount.times(susd_latestRate!);

  const profitUSD = eth_amountUSD.minus(susd_amountUSD);

  createLiquidate(
    event,
    market,
    susd,
    bigDecimalToBigInt(susd_amount),
    bigDecimalToBigInt(eth_amount),
    susd_amountUSD,
    address,
    liquidator,
    profitUSD
  );
  addMarketTokenBalance(
    event,
    market,
    bigDecimalToBigInt(eth_amount).times(BigInt.fromString("-1")),
    eth_latestRate!
  );

  loanEntity.isOpen = false;
  loanEntity.closedAt = event.block.timestamp;
  loanEntity.collateralAmount = toDecimal(BigInt.fromI32(0));
  loanEntity.save();
}

export function handleLoanPartiallyLiquidated(
  event: LoanPartiallyLiquidatedEvent
): void {
  const loanPartiallyLiquidatedEntity = new LoanPartiallyLiquidated(
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

  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
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

  const address = event.params.account;

  const liquidator = event.params.liquidator;
  const eth = getOrCreateToken(ETH_ADDRESS);
  const eth_latestRate = getLatestRate("sETH", event.transaction.hash.toHex());
  const eth_amount = event.params.collateralLiquidated;
  const eth_amountUSD = toDecimal(eth_amount).times(eth_latestRate!);
  const market = getOrCreateMarket(eth.id, event);

  const susd = getOrCreateToken(sUSD_ADDRESS);
  const susd_latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const susd_amount = event.params.amountLiquidated;
  const susd_amountUSD = toDecimal(susd_amount).times(susd_latestRate!);

  const profitUSD = eth_amountUSD.minus(susd_amountUSD);

  createLiquidate(
    event,
    market,
    susd,
    susd_amount,
    eth_amount,
    susd_amountUSD,
    address,
    liquidator,
    profitUSD
  );
  addMarketTokenBalance(
    event,
    market,
    eth_amount.times(BigInt.fromString("-1")),
    eth_latestRate!
  );
}

export function handleLoanRepaymentMade(event: LoanRepaymentMadeEvent): void {
  const loanRepaid = new LoanRepaid(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanRepaid.repaidAmount = toDecimal(event.params.amountRepaid);
  loanRepaid.newLoanAmount = toDecimal(event.params.amountAfter);
  loanRepaid.loanId = event.params.id;
  loanRepaid.account = event.params.account;
  loanRepaid.timestamp = event.block.timestamp;
  loanRepaid.save();

  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity == null) {
    log.error(
      "for handleLoanRepaid there should be a loan entity for this id: {} in this hash: {}",
      [event.params.id.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.amount = loanRepaid.newLoanAmount;

  // We are repaying sETH
  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const latestRate = getLatestRate("sUSD", txHash);

  const repayToken = getOrCreateToken(ETH_ADDRESS);
  const repayAmount = event.transaction.value;
  const repayUSD = toDecimal(repayAmount).times(latestRate!);

  const market = getOrCreateMarket(repayToken.id, event);

  createRepay(
    event,
    market,
    repayToken,
    repayAmount,
    repayUSD,
    address,
    event.transaction.from
  );

  loanEntity.save();
}

export function handleCollateralDeposited(
  event: CollateralDepositedEvent
): void {
  const collateralDepositedEntity = new CollateralDeposited(
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

  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity) {
    loanEntity.collateralAmount = collateralDepositedEntity.collateralAfter;
    loanEntity.save();
  }

  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const token = getOrCreateToken(ETH_ADDRESS);
  const amount = event.params.amountDeposited;
  const latestRate = getLatestRate("sETH", txHash);
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);

  createDeposit(event, market, token, amount, amountUSD, address);
  addMarketTokenBalance(event, market, amount, latestRate!);
}

export function handleCollateralWithdrawn(
  event: CollateralWithdrawnEvent
): void {
  const collateralWithdrawnEntity = new CollateralWithdrawn(
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

  const loanEntity = Loan.load(event.params.id.toHex() + "-sETH");
  if (loanEntity) {
    loanEntity.collateralAmount = collateralWithdrawnEntity.collateralAfter;
    loanEntity.save();
  }

  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const token = getOrCreateToken(ETH_ADDRESS);
  const amount = event.params.amountWithdrawn;
  const latestRate = getLatestRate("sETH", txHash);
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);

  createWithdraw(event, market, token, amount, amountUSD, address);
  addMarketTokenBalance(
    event,
    market,
    amount.times(BigInt.fromString("-1")),
    latestRate!
  );
}

// Drawdown is borrow
export function handleLoanDrawnDown(event: LoanDrawnDownEvent): void {
  const loanEntity = Loan.load(event.params.id.toHex() + "-sUSD");
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

  // We are depositing ETH and borrowing sETH
  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;
  const latestRate = getLatestRate("sUSD", txHash);
  const depositToken = getOrCreateToken(ETH_ADDRESS);
  const borrowAmount = event.params.amount;
  const borrowUSD = toDecimal(borrowAmount).times(latestRate!);
  // Get sETH rate here
  const market = getOrCreateMarket(depositToken.id, event);

  createBorrow(
    event,
    market,
    getOrCreateToken(sETH_ADDRESS),
    borrowAmount,
    borrowUSD,
    address
  );
}

// LEGACY FUNCTIONS

function addLoanEntity(
  event: LegacyLoanCreatedEvent,
  collateralMinted: string
): Loan {
  const loanEntity = new Loan(
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
  const loanEntity = addLoanEntity(event, "sETH");
  loanEntity.collateralMinted = "sETH";
  loanEntity.save();

  // We are depositing ETH and borrowing sETH
  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const latestRate = getLatestRate("sETH", txHash);

  const depositToken = getOrCreateToken(ETH_ADDRESS);
  const depositAmount = event.transaction.value;
  const depositUSD = toDecimal(depositAmount).times(latestRate!);

  const borrowAmount = event.params.amount;
  const borrowUSD = toDecimal(borrowAmount).times(latestRate!);
  // Get sETH rate here
  const market = getOrCreateMarket(depositToken.id, event);

  // We can use loanID to call getLoan info from the contract
  // and use that for deposit and withdraw
  createDeposit(
    event,
    market,
    depositToken,
    depositAmount,
    depositUSD,
    address
  );
  createBorrow(
    event,
    market,
    getOrCreateToken(sETH_ADDRESS),
    borrowAmount,
    borrowUSD,
    address
  );
  addMarketTokenBalance(event, market, depositAmount, latestRate!);
}

export function handleLoanCreatedsUSDLegacy(
  event: LegacyLoanCreatedEvent
): void {
  const loanEntity = addLoanEntity(event, "sUSD");
  loanEntity.collateralMinted = "sUSD";
  loanEntity.save();

  // We are depositing ETH and borrowing sETH
  const txHash = event.transaction.hash.toHex();
  const address = event.params.account;

  const latestRate = getLatestRate("sETH", txHash);

  const depositToken = getOrCreateToken(ETH_ADDRESS);
  const depositAmount = event.transaction.value;
  const depositUSD = toDecimal(depositAmount).times(latestRate!);

  const susd_latestRate = getLatestRate("sUSD", txHash);
  const borrowAmount = event.params.amount;
  const borrowUSD = toDecimal(borrowAmount).times(susd_latestRate!);
  // Get sETH rate here
  const market = getOrCreateMarket(depositToken.id, event);

  createDeposit(
    event,
    market,
    depositToken,
    depositAmount,
    depositUSD,
    address
  );
  createBorrow(
    event,
    market,
    getOrCreateToken(sUSD_ADDRESS),
    borrowAmount,
    borrowUSD,
    address
  );
  addMarketTokenBalance(event, market, depositAmount, latestRate!);
}

function closeLoan(
  event: LegacyLoanClosedEvent,
  collateralMinted: string
): void {
  const loanEntity = Loan.load(
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

// Functions below this use sUSD output and eth input

// NOTE no need to close the loan here as the LoanClosed event was emitted directly prior to this event
export function handleLoanLiquidatedLegacy(
  event: LegacyLoanLiquidatedEvent
): void {
  const loanLiquidatedEntity = new LoanLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanLiquidatedEntity.loanId = event.params.loanID;
  loanLiquidatedEntity.account = event.params.account;
  loanLiquidatedEntity.liquidator = event.params.liquidator;
  loanLiquidatedEntity.timestamp = event.block.timestamp;
  loanLiquidatedEntity.save();

  const loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error(
      "for handleLoanPartiallyLiquidated there should be a loan entity for this id: {} in this hash: {}",
      [event.params.loanID.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }

  const address = event.params.account;

  const liquidator = event.params.liquidator;
  const eth = getOrCreateToken(ETH_ADDRESS);
  const eth_latestRate = getLatestRate("sETH", event.transaction.hash.toHex());
  const eth_amount = loanEntity.collateralAmount;
  const eth_amountUSD = eth_amount.times(eth_latestRate!);
  const market = getOrCreateMarket(eth.id, event);

  const susd = getOrCreateToken(sUSD_ADDRESS);
  const susd_latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const susd_amount = loanEntity.amount;
  const susd_amountUSD = susd_amount.times(susd_latestRate!);

  const profitUSD = eth_amountUSD.minus(susd_amountUSD);

  createLiquidate(
    event,
    market,
    susd,
    bigDecimalToBigInt(susd_amount),
    bigDecimalToBigInt(eth_amount),
    susd_amountUSD,
    address,
    liquidator,
    profitUSD
  );
  addMarketTokenBalance(
    event,
    market,
    bigDecimalToBigInt(eth_amount).times(BigInt.fromString("-1")),
    eth_latestRate!
  );
}

export function handleLoanPartiallyLiquidatedLegacy(
  event: LegacyLoanPartiallyLiquidatedEvent
): void {
  const loanPartiallyLiquidatedEntity = new LoanPartiallyLiquidated(
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

  const loanEntity = Loan.load(event.params.loanID.toHex());
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

  const address = event.params.account;

  const liquidator = event.params.liquidator;
  const eth = getOrCreateToken(ETH_ADDRESS);
  const eth_latestRate = getLatestRate("sETH", event.transaction.hash.toHex());
  const eth_amount = event.params.liquidatedCollateral;
  const eth_amountUSD = toDecimal(eth_amount).times(eth_latestRate!);
  const market = getOrCreateMarket(eth.id, event);

  const susd = getOrCreateToken(sUSD_ADDRESS);
  const susd_latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const susd_amount = event.params.liquidatedAmount;
  const susd_amountUSD = toDecimal(susd_amount).times(susd_latestRate!);

  const profitUSD = eth_amountUSD.minus(susd_amountUSD);

  createLiquidate(
    event,
    market,
    susd,
    susd_amount,
    eth_amount,
    susd_amountUSD,
    address,
    liquidator,
    profitUSD
  );
  addMarketTokenBalance(
    event,
    market,
    eth_amount.times(BigInt.fromString("-1")),
    eth_latestRate!
  );
}

export function handleCollateralDepositedLegacy(
  event: LegacyCollateralDepositedEvent
): void {
  const collateralDepositedEntity = new CollateralDeposited(
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

  const address = event.params.account;
  const token = getOrCreateToken(ETH_ADDRESS);
  const latestRate = getLatestRate("sETH", event.transaction.hash.toHex());

  const amount = event.params.collateralAmount;
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);

  createDeposit(event, market, token, amount, amountUSD, address);
  addMarketTokenBalance(event, market, amount, latestRate!);
}

export function handleCollateralWithdrawnLegacy(
  event: LegacyCollateralWithdrawnEvent
): void {
  const collateralWithdrawnEntity = new CollateralWithdrawn(
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

  const address = event.params.account;
  const token = getOrCreateToken(ETH_ADDRESS);
  const latestRate = getLatestRate("sETH", event.transaction.hash.toHex());

  const amount = event.params.amountWithdrawn;
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);

  createWithdraw(event, market, token, amount, amountUSD, address);
  addMarketTokenBalance(
    event,
    market,
    amount.times(BigInt.fromString("-1")),
    latestRate!
  );
}

export function handleLoanRepaidLegacy(event: LegacyLoanRepaidEvent): void {
  const loanRepaid = new LoanRepaid(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  loanRepaid.repaidAmount = toDecimal(event.params.repaidAmount);
  loanRepaid.newLoanAmount = toDecimal(event.params.newLoanAmount);
  loanRepaid.loanId = event.params.loanID;
  loanRepaid.account = event.params.account;
  loanRepaid.timestamp = event.block.timestamp;
  loanRepaid.save();

  const loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error(
      "for handleLoanRepaid there should be a loan entity for this id: {} in this hash: {}",
      [event.params.loanID.toHex(), event.transaction.hash.toHex()]
    );
    return;
  }
  loanEntity.amount = loanRepaid.newLoanAmount;
  loanEntity.save();

  const address = event.params.account;
  const token = getOrCreateToken(ETH_ADDRESS);
  const sUSDToken = getOrCreateToken(sUSD_ADDRESS);
  const latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const amount = event.params.repaidAmount;
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);

  createRepay(event, market, sUSDToken, amount, amountUSD, address, address);
}
