import {
  CollateralShort as CollateralShortContract,
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
  CollateralDeposited as CollateralDepositedEvent,
  CollateralWithdrawn as CollateralWithdrawnEvent,
  LoanRepaymentMade as LoanRepaymentMadeEvent,
  LoanDrawnDown as LoanDrawnDownEvent,
  LoanPartiallyLiquidated as LoanPartiallyLiquidatedEvent,
  LoanClosedByLiquidation as LoanClosedByLiquidationEvent,
  LoanClosedByRepayment as LoanClosedByRepaymentEvent,
  MinCollateralUpdated as MinCollateralUpdatedEvent,
  IssueFeeRateUpdated as IssueFeeRateUpdatedEvent,
  CanOpenLoansUpdated as CanOpenLoansUpdatedEvent,
} from "../../generated/shorts_CollateralShort_0/CollateralShort";

import {
  Short,
  ShortLiquidation,
  ShortCollateralChange,
  ShortLoanChange,
  ShortContract,
  ShortContractUpdate,
} from "../../generated/schema";

import {
  BigInt,
  Bytes,
  log,
  Address,
  BigDecimal,
} from "@graphprotocol/graph-ts";

import { strToBytes, toDecimal, getLatestRate, ZERO } from "./lib/helpers";

function saveContractLevelUpdate(
  txHash: string,
  logIndex: string,
  field: string,
  value: string,
  timestamp: BigInt,
  blockNumber: BigInt,
  shortContract: ShortContract
): void {
  let shortContractUpdateEntity = new ShortContractUpdate(
    txHash + "-" + logIndex
  );
  shortContractUpdateEntity.field = field;
  shortContractUpdateEntity.value = value;
  shortContractUpdateEntity.timestamp = timestamp;
  shortContractUpdateEntity.blockNumber = blockNumber;
  shortContractUpdateEntity.contractData = shortContract.id;
  shortContractUpdateEntity.save();
}

function addContractData(
  contractAddress: Address,
  txHash: string,
  logIndex: string,
  timestamp: BigInt,
  blockNumber: BigInt
): ShortContract {
  let collateralShortContract = CollateralShortContract.bind(contractAddress);
  let issueFeeRate = collateralShortContract.try_issueFeeRate();

  let shortContractEntity = ShortContract.load(contractAddress.toHex());
  if (shortContractEntity == null) {
    shortContractEntity = new ShortContract(contractAddress.toHex());
    saveContractLevelUpdate(
      txHash,
      logIndex,
      "issueFeeRate",
      !issueFeeRate.reverted ? issueFeeRate.value.toString() : "0",
      timestamp,
      blockNumber,
      shortContractEntity as ShortContract
    );
  }
  shortContractEntity.minCratio = collateralShortContract.minCratio();
  shortContractEntity.minCollateral = toDecimal(
    collateralShortContract.minCollateral()
  );
  shortContractEntity.issueFeeRate = toDecimal(
    !issueFeeRate.reverted ? issueFeeRate.value : ZERO
  );
  shortContractEntity.manager = collateralShortContract.manager();
  shortContractEntity.canOpenLoans = collateralShortContract.canOpenLoans();
  shortContractEntity.save();
  return shortContractEntity as ShortContract;
}

function loadContractData(
  contractAddress: Address,
  txHash: string,
  logIndex: string,
  timestamp: BigInt,
  blockNumber: BigInt
): ShortContract {
  let shortContractEntity = ShortContract.load(contractAddress.toHex());
  if (shortContractEntity == null) {
    shortContractEntity = addContractData(
      contractAddress,
      txHash,
      logIndex,
      timestamp,
      blockNumber
    );
  }
  return shortContractEntity as ShortContract;
}

function createShort(event: LoanCreatedEvent, collateralLocked: Bytes): void {
  let contractData: ShortContract = addContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number
  );

  let shortEntity = new Short(event.params.id.toString());
  shortEntity.contractData = contractData.id;
  shortEntity.txHash = event.transaction.hash.toHex();
  shortEntity.account = event.params.account;
  shortEntity.collateralLocked = collateralLocked;
  shortEntity.collateralLockedAmount = toDecimal(event.params.collateral);
  shortEntity.synthBorrowed = event.params.currency;
  shortEntity.synthBorrowedAmount = toDecimal(event.params.amount);
  shortEntity.isOpen = true;
  shortEntity.createdAt = event.block.timestamp;
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.createdAtBlock = event.block.number;
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    false,
    toDecimal(event.params.amount),
    shortEntity.synthBorrowedAmount,
    event.block.timestamp,
    event.block.number,
    shortEntity as Short
  );
}

function handleDepositOrWithdrawal(
  id: string,
  txHash: string,
  logIndex: string,
  amount: BigDecimal,
  collateralAfter: BigDecimal,
  isDeposit: boolean,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let shortEntity = Short.load(id);
  if (shortEntity == null) {
    log.error(
      "trying to withdraw or deposit collateral on a loan that does not exist with id: {} from txHash: {}",
      [id, txHash]
    );
    return;
  }
  let newTotal: BigDecimal;
  if (isDeposit) {
    newTotal = shortEntity.collateralLockedAmount.plus(amount);
  } else {
    newTotal = shortEntity.collateralLockedAmount.minus(amount);
  }
  if (collateralAfter.notEqual(newTotal)) {
    log.error(
      "for isDeposit: {}, there is a math error where collateralAfter: {} does not equal current deposit: {} plus or minus new deposit: {}, which totals to: {}",
      [
        isDeposit.toString(),
        collateralAfter.toString(),
        shortEntity.collateralLockedAmount.toString(),
        amount.toString(),
        newTotal.toString(),
      ]
    );
  }
  shortEntity.collateralLockedAmount = collateralAfter;
  shortEntity.accruedInterestLastUpdateTimestamp = timestamp;
  shortEntity.save();
  let shortCollateralChangeEntity = new ShortCollateralChange(
    txHash + "-" + logIndex
  );
  shortCollateralChangeEntity.isDeposit = isDeposit;
  shortCollateralChangeEntity.amount = amount;
  shortCollateralChangeEntity.collateralAfter = collateralAfter;
  shortCollateralChangeEntity.timestamp = timestamp;
  shortCollateralChangeEntity.short = shortEntity.id;
  shortCollateralChangeEntity.blockNumber = blockNumber;
  shortCollateralChangeEntity.save();
}

function saveLoanChangeEntity(
  txHash: string,
  logIndex: string,
  isRepayment: boolean,
  amount: BigDecimal,
  amountAfter: BigDecimal,
  timestamp: BigInt,
  blockNumber: BigInt,
  shortEntity: Short
): void {
  let shortLoanChangeEntity = new ShortLoanChange(txHash + "-" + logIndex);
  let rate = getLatestRate(shortEntity.synthBorrowed.toString(), txHash);
  shortLoanChangeEntity.rate = rate ? (rate as BigDecimal) : toDecimal(ZERO);
  shortLoanChangeEntity.isRepayment = isRepayment;
  shortLoanChangeEntity.amount = amount;
  shortLoanChangeEntity.loanAfter = amountAfter;
  shortLoanChangeEntity.timestamp = timestamp;
  shortLoanChangeEntity.blockNumber = blockNumber;
  shortLoanChangeEntity.short = shortEntity.id;
  shortLoanChangeEntity.save();
}

function handleLiquidations(
  txHash: string,
  logIndex: string,
  loanId: string,
  isClosed: boolean,
  liquidatedAmount: BigDecimal,
  liquidatedCollateral: BigDecimal,
  liquidator: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let shortEntity = Short.load(loanId);
  if (shortEntity == null) {
    log.error(
      "trying to liquidate a loan that does not exist with id: {} from txHash: {}",
      [loanId, txHash]
    );
    return;
  }
  if (isClosed) {
    shortEntity.isOpen = false;
  }
  shortEntity.accruedInterestLastUpdateTimestamp = timestamp;
  shortEntity.collateralLockedAmount =
    shortEntity.collateralLockedAmount.minus(liquidatedCollateral);
  shortEntity.synthBorrowedAmount =
    shortEntity.synthBorrowedAmount.minus(liquidatedAmount);
  shortEntity.save();
  let shortLiquidationEntity = new ShortLiquidation(txHash + "-" + logIndex);
  shortLiquidationEntity.liquidator = liquidator;
  shortLiquidationEntity.isClosed = isClosed;
  shortLiquidationEntity.liquidatedAmount = liquidatedAmount;
  shortLiquidationEntity.liquidatedCollateral = liquidatedCollateral;
  shortLiquidationEntity.timestamp = timestamp;
  shortLiquidationEntity.blockNumber = blockNumber;
  shortLiquidationEntity.short = shortEntity.id;
  shortLiquidationEntity.save();
}

export function handleShortLoanCreatedsUSD(event: LoanCreatedEvent): void {
  createShort(event, strToBytes("sUSD", 32));
}

export function handleShortLoanClosedsUSD(event: LoanClosedEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error(
      "trying to close a loan that does not exist with id: {} from txHash: {}",
      [event.params.id.toString(), event.transaction.hash.toHex()]
    );
    return;
  }
  shortEntity.isOpen = false;
  shortEntity.closedAt = event.block.timestamp;
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.synthBorrowedAmount = toDecimal(BigInt.fromI32(0));
  shortEntity.collateralLockedAmount = toDecimal(BigInt.fromI32(0));
  shortEntity.save();
}

export function handleShortCollateralDepositedsUSD(
  event: CollateralDepositedEvent
): void {
  handleDepositOrWithdrawal(
    event.params.id.toString(),
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    toDecimal(event.params.amountDeposited),
    toDecimal(event.params.collateralAfter),
    true,
    event.block.timestamp,
    event.block.number
  );
}

export function handleShortCollateralWithdrawnsUSD(
  event: CollateralWithdrawnEvent
): void {
  handleDepositOrWithdrawal(
    event.params.id.toString(),
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    toDecimal(event.params.amountWithdrawn),
    toDecimal(event.params.collateralAfter),
    false,
    event.block.timestamp,
    event.block.number
  );
}

export function handleShortLoanRepaymentMadesUSD(
  event: LoanRepaymentMadeEvent
): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error(
      "trying to repay on a loan that does not exist with id: {} from txHash: {}",
      [event.params.id.toString(), event.transaction.hash.toHex()]
    );
    return;
  }
  let newTotal = shortEntity.synthBorrowedAmount.minus(
    toDecimal(event.params.amountRepaid)
  );
  if (toDecimal(event.params.amountAfter).notEqual(newTotal)) {
    log.error(
      "for short loan replayment there is a math error where amountAfter: {} does not equal current synthBorrowedAmount: {} minus new repayment: {}, which totals to: {}",
      [
        event.params.amountAfter.toString(),
        shortEntity.synthBorrowedAmount.toString(),
        event.params.amountRepaid.toString(),
        newTotal.toString(),
      ]
    );
  }
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.synthBorrowedAmount = toDecimal(event.params.amountAfter);
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    true,
    toDecimal(event.params.amountRepaid),
    toDecimal(event.params.amountAfter),
    event.block.timestamp,
    event.block.number,
    shortEntity as Short
  );
}

// NOTE the drawn down event should pass the amount after like the repayment event
export function handleShortLoanDrawnDownsUSD(event: LoanDrawnDownEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error(
      "trying to increase a loan that does not exist with id: {} from txHash: {}",
      [event.params.id.toString(), event.transaction.hash.toHex()]
    );
    return;
  }
  shortEntity.synthBorrowedAmount = shortEntity.synthBorrowedAmount.plus(
    toDecimal(event.params.amount)
  );
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    false,
    toDecimal(event.params.amount),
    shortEntity.synthBorrowedAmount,
    event.block.timestamp,
    event.block.number,
    shortEntity as Short
  );
}

export function handleLoanPartiallyLiquidatedsUSD(
  event: LoanPartiallyLiquidatedEvent
): void {
  handleLiquidations(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.id.toString(),
    false,
    toDecimal(event.params.amountLiquidated),
    toDecimal(event.params.collateralLiquidated),
    event.params.liquidator,
    event.block.timestamp,
    event.block.number
  );
}

export function handleLoanClosedByLiquidationsUSD(
  event: LoanClosedByLiquidationEvent
): void {
  handleLiquidations(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.id.toString(),
    true,
    toDecimal(event.params.amountLiquidated),
    toDecimal(event.params.collateralLiquidated),
    event.params.liquidator,
    event.block.timestamp,
    event.block.number
  );
}

export function handleLoanClosedByRepayment(
  event: LoanClosedByRepaymentEvent
): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error(
      "trying to close a loan that does not exist with id: {} from txHash: {}",
      [event.params.id.toString(), event.transaction.hash.toHex()]
    );
    return;
  }
  shortEntity.isOpen = false;
  shortEntity.closedAt = event.block.timestamp;
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.synthBorrowedAmount = toDecimal(BigInt.fromI32(0));
  shortEntity.collateralLockedAmount = toDecimal(BigInt.fromI32(0));
  shortEntity.save();
}

export function handleMinCollateralUpdatedsUSD(
  event: MinCollateralUpdatedEvent
): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number
  );
  shortContractEntity.minCollateral = toDecimal(event.params.minCollateral);
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    "minCollateral",
    event.params.minCollateral.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract
  );
}

export function handleIssueFeeRateUpdatedsUSD(
  event: IssueFeeRateUpdatedEvent
): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number
  );
  shortContractEntity.issueFeeRate = toDecimal(event.params.issueFeeRate);
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    "issueFeeRate",
    event.params.issueFeeRate.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract
  );
}

export function handleCanOpenLoansUpdatedsUSD(
  event: CanOpenLoansUpdatedEvent
): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number
  );
  shortContractEntity.canOpenLoans = event.params.canOpenLoans;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    "canOpenLoans",
    event.params.canOpenLoans ? "true" : "false",
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract
  );
}
