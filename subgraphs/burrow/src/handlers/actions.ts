import { BigInt, log } from "@graphprotocol/graph-ts";
import { getOrCreateAccount } from "../helpers/account";
import {
  getOrCreatePosition,
  getOrCreatePositionSnapshot,
} from "../helpers/position";

import {
  getOrCreateBorrow,
  getOrCreateDeposit,
  getOrCreateRepayment,
  getOrCreateWithdrawal,
} from "../helpers/actions";
import {
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
} from "../helpers/market";
import { getOrCreateToken } from "../helpers/token";

import { updateMarket } from "../update/market";
import { amount_to_shares } from "../utils/shares";
import { updateProtocol } from "../update/protocol";
import {
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateFinancialDailySnapshot,
  getOrCreateProtocol,
} from "../helpers/protocol";
import { parse0 } from "../utils/parser";
import { BI_ZERO, BI_BD, BD_ZERO } from "../utils/const";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { EventData } from "../utils/type";

export function handleDeposit(event: EventData): void {
  const receipt = event.receipt;
  const logIndex = event.logIndex;
  const data = event.data;

  const deposit = getOrCreateDeposit(
    receipt.outcome.id
      .toBase58()
      .concat("-")
      .concat((logIndex as i32).toString()),
    receipt
  );
  deposit.logIndex = logIndex as i32;
  const parsedData = parse0(data);
  const account_id = parsedData[0];
  const amount = parsedData[1];
  const token_id = parsedData[2];

  const market = getOrCreateMarket(token_id);
  const protocol = getOrCreateProtocol();

  const dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);

  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
  const financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);

  const account = getOrCreateAccount(account_id);
  const position = getOrCreatePosition(account, market, "LENDER", receipt);
  const token = getOrCreateToken(token_id);

  deposit.account = account.id;
  deposit.amount = BigInt.fromString(amount);
  deposit.asset = token.id;
  deposit.market = market.id;
  deposit.position = position.id;

  deposit.amountUSD = deposit.amount
    .divDecimal(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(token.lastPriceUSD!);

  // usage metrics
  if (position._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveDepositors += 1;
  }
  if (account._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveUsers += 1;
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageDailySnapshot.dailyDepositCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.hourlyDepositCount += 1;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  position.depositCount += 1;
  position.balance = position.balance.plus(deposit.amount);
  position._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );

  // update account
  if (account.depositCount == 0) {
    protocol.cumulativeUniqueDepositors += 1;
    protocol.cumulativeUniqueUsers += 1;
  }
  account.depositCount += 1;
  account._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );

  // deposit amount
  market.outputTokenSupply = market.outputTokenSupply.plus(
    amount_to_shares(
      BI_BD(deposit.amount),
      market.outputTokenSupply,
      market._totalDeposited
    )
  );
  market._totalDeposited = market._totalDeposited.plus(BI_BD(deposit.amount));

  // historical
  market._totalDepositedHistory = market._totalDepositedHistory.plus(
    deposit.amount
  );
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );

  // snapshot
  dailySnapshot.dailyDepositUSD = dailySnapshot.dailyDepositUSD.plus(
    deposit.amountUSD
  );
  hourlySnapshot.hourlyDepositUSD = hourlySnapshot.hourlyDepositUSD.plus(
    deposit.amountUSD
  );
  financialDailySnapshot.dailyDepositUSD =
    financialDailySnapshot.dailyDepositUSD.plus(deposit.amountUSD);

  const positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
  positionSnapshot.logIndex = logIndex as i32;

  updateMarket(
    market,
    dailySnapshot,
    hourlySnapshot,
    financialDailySnapshot,
    receipt
  );

  positionSnapshot.save();
  financialDailySnapshot.save();
  usageDailySnapshot.save();
  usageHourlySnapshot.save();
  dailySnapshot.save();
  hourlySnapshot.save();
  market.save();
  account.save();
  deposit.save();
  position.save();
  protocol.save();

  updateProtocol();
}

export function handleDepositToReserve(event: EventData): void {
  const parsedData = parse0(event.data);
  // const account_id = parsedData[0];
  const amount = parsedData[1];
  const token_id = parsedData[2];

  const market = getOrCreateMarket(token_id);

  market._totalReserved = market._totalReserved.plus(
    BigDecimal.fromString(amount)
  );
  // for revenue calculation
  market._added_to_reserve = market._added_to_reserve.plus(
    BigDecimal.fromString(amount)
  );

  market.save();
}

export function handleWithdraw(event: EventData): void {
  const receipt = event.receipt;
  const logIndex = event.logIndex;
  const data = event.data;

  const withdraw = getOrCreateWithdrawal(
    receipt.outcome.id
      .toBase58()
      .concat("-")
      .concat((logIndex as i32).toString()),
    receipt
  );
  withdraw.logIndex = logIndex as i32;
  const parsedData = parse0(data);
  const account_id = parsedData[0];
  const amount = parsedData[1];
  const token_id = parsedData[2];

  const market = getOrCreateMarket(token_id.toString());
  const dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
  const financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
  const account = getOrCreateAccount(account_id.toString());
  const position = getOrCreatePosition(account, market, "LENDER", receipt);

  const token = getOrCreateToken(token_id.toString());
  withdraw.account = account.id;
  withdraw.amount = BigInt.fromString(amount.toString());
  withdraw.asset = token.id;
  withdraw.market = market.id;
  withdraw.position = position.id;

  withdraw.amountUSD = withdraw.amount
    .divDecimal(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(token.lastPriceUSD!);

  // usage metrics
  if (account._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveUsers += 1;
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageDailySnapshot.dailyWithdrawCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.hourlyWithdrawCount += 1;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  position.withdrawCount += 1;

  // close if balance is zero
  if (position.balance.lt(withdraw.amount)) {
    position.balance = BI_ZERO;
    account.openPositionCount -= 1;
    account.closedPositionCount += 1;

    market.openPositionCount -= 1;
    market.closedPositionCount += 1;
    market.lendingPositionCount -= 1;

    position.hashClosed = receipt.outcome.id.toBase58();
    position.timestampClosed = BigInt.fromU64(
      receipt.block.header.timestampNanosec / 1000000000
    );
    position.blockNumberClosed = BigInt.fromU64(receipt.block.header.height);
  }

  account.withdrawCount = account.withdrawCount + 1;
  market._totalWithrawnHistory = market._totalWithrawnHistory.plus(
    withdraw.amount
  );

  market.outputTokenSupply = market.outputTokenSupply.minus(
    amount_to_shares(
      BI_BD(withdraw.amount),
      market.outputTokenSupply,
      market._totalDeposited
    )
  );
  market._totalDeposited = market._totalDeposited.minus(BI_BD(withdraw.amount));

  if (market._totalDeposited.lt(BD_ZERO)) {
    market._totalReserved = market._totalReserved.plus(market._totalDeposited);
    market._totalDeposited = BD_ZERO;
    market.outputTokenSupply = BI_ZERO;
    if (market._totalReserved.lt(BD_ZERO)) {
      log.warning("OVERFLOW :: market._totalReserved < 0", []);
      market._totalReserved = BD_ZERO;
    }
  }

  // snapshot
  dailySnapshot.dailyWithdrawUSD = dailySnapshot.dailyWithdrawUSD.plus(
    withdraw.amountUSD
  );
  hourlySnapshot.hourlyWithdrawUSD = hourlySnapshot.hourlyWithdrawUSD.plus(
    withdraw.amountUSD
  );
  financialDailySnapshot.dailyWithdrawUSD =
    financialDailySnapshot.dailyWithdrawUSD.plus(withdraw.amountUSD);

  const positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
  positionSnapshot.logIndex = logIndex as i32;

  updateMarket(
    market,
    dailySnapshot,
    hourlySnapshot,
    financialDailySnapshot,
    receipt
  );

  positionSnapshot.save();
  financialDailySnapshot.save();
  dailySnapshot.save();
  hourlySnapshot.save();
  usageDailySnapshot.save();
  usageHourlySnapshot.save();
  market.save();
  account.save();
  withdraw.save();
  position._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );
  position.save();

  updateProtocol();
}

export function handleBorrow(event: EventData): void {
  const receipt = event.receipt;
  const logIndex = event.logIndex;
  const data = event.data;

  const borrow = getOrCreateBorrow(
    receipt.outcome.id
      .toBase58()
      .concat("-")
      .concat((logIndex as i32).toString()),
    receipt
  );
  borrow.logIndex = logIndex as i32;
  const parsedData = parse0(data);
  const account_id = parsedData[0];
  const amount = parsedData[1];
  const token_id = parsedData[2];

  const market = getOrCreateMarket(token_id.toString());
  const protocol = getOrCreateProtocol();
  const dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
  const financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
  const account = getOrCreateAccount(account_id.toString());
  const position = getOrCreatePosition(account, market, "BORROWER", receipt);

  const token = getOrCreateToken(token_id.toString());
  borrow.account = account.id;
  borrow.amount = BigInt.fromString(amount.toString());
  borrow.asset = token.id;
  borrow.market = market.id;
  borrow.position = position.id;

  borrow.amountUSD = borrow.amount
    .divDecimal(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(token.lastPriceUSD!);

  if (position._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveBorrowers += 1;
  }
  if (account._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveUsers += 1;
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageDailySnapshot.dailyBorrowCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.hourlyBorrowCount += 1;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  position.balance = position.balance.plus(borrow.amount);

  if (account.borrowCount == 0) {
    protocol.cumulativeUniqueBorrowers += 1;
  }
  account.borrowCount += 1;
  // asset.borrowed.deposit(borrowed_shares, amount);
  market._totalBorrowed = market._totalBorrowed.plus(BI_BD(borrow.amount));
  market._totalBorrowedHistory = market._totalBorrowedHistory.plus(
    borrow.amount
  );
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );

  // borrowed amount gets withdrawn from the account => so we need to add that to deposits
  // asset.supplied.deposit(supplied_shares, amount);
  market._totalDeposited = market._totalDeposited.plus(BI_BD(borrow.amount));
  market.outputTokenSupply = market.outputTokenSupply.plus(
    amount_to_shares(
      BI_BD(borrow.amount),
      market.outputTokenSupply,
      market._totalDeposited
    )
  );

  // snapshot
  dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(
    borrow.amountUSD
  );
  hourlySnapshot.hourlyBorrowUSD = hourlySnapshot.hourlyBorrowUSD.plus(
    borrow.amountUSD
  );
  financialDailySnapshot.dailyBorrowUSD =
    financialDailySnapshot.dailyBorrowUSD.plus(borrow.amountUSD);

  const positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
  positionSnapshot.logIndex = logIndex as i32;

  updateMarket(
    market,
    dailySnapshot,
    hourlySnapshot,
    financialDailySnapshot,
    receipt
  );

  positionSnapshot.save();
  financialDailySnapshot.save();
  usageDailySnapshot.save();
  usageHourlySnapshot.save();
  hourlySnapshot.save();
  dailySnapshot.save();
  market.save();
  account._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );
  account.save();
  borrow.save();
  position.save();
  position._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );
  protocol.save();

  updateProtocol();
}

export function handleRepayment(event: EventData): void {
  const receipt = event.receipt;
  const logIndex = event.logIndex;
  const data = event.data;

  const repay = getOrCreateRepayment(
    receipt.outcome.id
      .toBase58()
      .concat("-")
      .concat((logIndex as i32).toString()),
    receipt
  );
  repay.logIndex = logIndex as i32;
  const parsedData = parse0(data);
  const account_id = parsedData[0];
  const amount = parsedData[1];
  const token_id = parsedData[2];

  const market = getOrCreateMarket(token_id.toString());
  const dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
  const financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
  const account = getOrCreateAccount(account_id.toString());
  const position = getOrCreatePosition(account, market, "BORROWER", receipt);

  const token = getOrCreateToken(token_id.toString());
  repay.market = market.id;
  repay.account = account.id;
  repay.amount = BigInt.fromString(amount.toString());
  repay.asset = token.id;
  repay.position = position.id;
  repay.amountUSD = repay.amount
    .divDecimal(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(token.lastPriceUSD!);

  if (account._last_active_timestamp.lt(usageDailySnapshot.timestamp)) {
    usageDailySnapshot.dailyActiveUsers += 1;
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageDailySnapshot.dailyRepayCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.hourlyRepayCount += 1;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  if (position.balance.lt(repay.amount)) {
    position.balance = BI_ZERO;
    account.openPositionCount -= 1;
    account.closedPositionCount += 1;

    market.openPositionCount -= 1;
    market.closedPositionCount += 1;
    market.borrowingPositionCount -= 1;

    position.hashClosed = receipt.outcome.id.toBase58();
    position.timestampClosed = BigInt.fromU64(
      receipt.block.header.timestampNanosec / 1000000000
    );
    position.blockNumberClosed = BigInt.fromU64(receipt.block.header.height);
  }

  account.repayCount += 1;

  // asset.borrowed.withdraw(borrowed_shares, amount);
  market._totalBorrowed = market._totalBorrowed.minus(BI_BD(repay.amount));
  market._totalRepaidHistory = market._totalRepaidHistory.plus(repay.amount);

  // minus repay amount from total deposited => because user has to deposit first to repay loan
  // asset.supplied.withdraw(supplied_shares, amount);
  market._totalDeposited = market._totalDeposited.minus(BI_BD(repay.amount));
  market.outputTokenSupply = market.outputTokenSupply.minus(
    amount_to_shares(
      BI_BD(repay.amount),
      market.outputTokenSupply,
      market._totalDeposited
    )
  );

  // snapshot
  dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(
    repay.amountUSD
  );
  hourlySnapshot.hourlyRepayUSD = hourlySnapshot.hourlyRepayUSD.plus(
    repay.amountUSD
  );
  financialDailySnapshot.dailyRepayUSD =
    financialDailySnapshot.dailyRepayUSD.plus(repay.amountUSD);

  const positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
  positionSnapshot.logIndex = logIndex as i32;

  updateMarket(
    market,
    dailySnapshot,
    hourlySnapshot,
    financialDailySnapshot,
    receipt
  );

  positionSnapshot.save();
  financialDailySnapshot.save();
  hourlySnapshot.save();
  dailySnapshot.save();
  usageDailySnapshot.save();
  usageHourlySnapshot.save();
  market.save();
  account._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );
  account.save();
  repay.save();
  position._last_active_timestamp = BigInt.fromU64(
    receipt.block.header.timestampNanosec / 1000000000
  );
  position.save();

  updateProtocol();
}
