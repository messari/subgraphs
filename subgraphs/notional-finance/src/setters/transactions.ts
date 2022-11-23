import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Account,
  Position,
  Market,
  Borrow,
  Deposit,
  PositionSnapshot,
  Liquidate,
  Withdraw,
  Repay,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  INT_ZERO,
  TransactionType,
  InterestRateSide,
  PROTOCOL_ID,
  BIGDECIMAL_HUNDRED,
  INT_HUNDRED,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { addAccountToProtocol, updateUsageMetrics } from "./usageMetrics";
import { getOrCreateLendingProtocol } from "../getters/protocol";
import { getOrCreateAccount } from "../getters/account";
import { getOrCreateMarket } from "../getters/market";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "../common/arrays";
import {
  updateFinancials,
  updateMarket,
  updateTVLAndBalances,
} from "./financialMetrics";
import { getTokenFromCurrency } from "../common/util";
import { Notional } from "../../generated/Notional/Notional";

export function getOrCreatePosition(
  event: ethereum.Event,
  account: Account,
  market: Market,
  side: string
): Position {
  const accountId = account.id;
  const marketId = market.id;
  const positionIdPrefix = `${accountId}-${marketId}-${side}`;

  // return open position if found
  for (let curr = 0; curr < account.openPositionCount; curr += 1) {
    const op = account.openPositions.at(curr);
    if (op.startsWith(positionIdPrefix)) {
      return Position.load(op)!;
    }
  }

  // close position and update position counts
  let count = 0;
  for (let curr = 0; curr < account.closedPositionCount; curr += 1) {
    const cp = account.closedPositions.at(curr);
    if (cp.startsWith(positionIdPrefix)) {
      count += 1;
    }
  }

  // create open position and update position counts
  const positionId = `${accountId}-${market.id}-${side}-${count}`;
  const position = new Position(positionId);

  account.openPositionCount += 1;
  account.openPositions = addToArrayAtIndex(
    account.openPositions,
    positionId,
    0
  );
  account.save();

  market.positionCount += 1;
  market.openPositionCount += 1;
  if (side == InterestRateSide.LENDER) {
    market.lendingPositionCount += 1;
  } else if (side == InterestRateSide.BORROWER) {
    market.borrowingPositionCount += 1;
  }
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount += 1;
  protocol.cumulativePositionCount += 1;
  protocol.save();

  // open position metadata
  position.account = accountId;
  position.market = market.id;
  position.balance = BIGINT_ZERO;
  position.side = side;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.isCollateral = market.canUseAsCollateral;

  // counts
  position.depositCount = INT_ZERO;
  position.borrowCount = INT_ZERO;
  position.repayCount = INT_ZERO;
  position.withdrawCount = INT_ZERO;
  position.liquidationCount = INT_ZERO;

  // derived
  // position.deposits = DERIVED;
  // position.borrows = DERIVED;
  // position.withdraws = DERIVED;
  // position.repays = DERIVED;
  // position.liquidations = DERIVED;
  // position.snapshots = DERIVED;

  position.save();

  return position;
}

export function closePosition(
  position: Position,
  account: Account,
  market: Market,
  event: ethereum.Event
): void {
  const account_index = account.openPositions.indexOf(position.id);
  account.openPositionCount -= 1;
  account.openPositions = removeFromArrayAtIndex(
    account.openPositions,
    account_index
  );
  account.closedPositionCount += 1;
  account.closedPositions = addToArrayAtIndex(
    account.closedPositions,
    position.id,
    0
  );
  account.save();

  market.openPositionCount -= 1;
  market.closedPositionCount += 1;
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();

  position.hashClosed = event.transaction.hash.toHexString();
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
  position.save();
}

export function createPositionSnapshot(
  position: Position,
  event: ethereum.Event
): void {
  const hash = event.transaction.hash.toHexString();
  const txlogIndex = event.transactionLogIndex.toI32();
  const snapshot = new PositionSnapshot(`${position.id}-${hash}-${txlogIndex}`);

  snapshot.position = position.id;
  snapshot.hash = hash;
  snapshot.logIndex = txlogIndex;
  snapshot.nonce = event.transaction.nonce;
  snapshot.balance = position.balance;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function updatePosition(
  marketId: string,
  transactionType: string,
  amount: BigInt,
  accountId: string,
  event: ethereum.Event,
  eventId: string
): void {
  let closePositionToggle = false;

  const market = getOrCreateMarket(event, marketId);
  const account = getOrCreateAccount(accountId);

  // interest rate side
  let side: string;
  if (
    [TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(
      transactionType
    )
  ) {
    side = InterestRateSide.LENDER;
  } else if (
    [TransactionType.BORROW, TransactionType.REPAY].includes(transactionType)
  ) {
    side = InterestRateSide.BORROWER;
  }

  const position = getOrCreatePosition(event, account, market, side!);

  // deposit
  if (transactionType == TransactionType.DEPOSIT) {
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;
    position.balance = position.balance.plus(amount);

    const deposit = new Deposit(eventId);
    deposit.position = position.id;
    deposit.save();
    addAccountToProtocol(transactionType, account, event);

    // withdraw
  } else if (transactionType == TransactionType.WITHDRAW) {
    account.withdrawCount = account.withdrawCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    position.balance = position.balance.minus(amount);

    const withdraw = new Withdraw(eventId);
    withdraw.position = position.id;
    withdraw.save();

    if (position.balance.equals(BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  } else if (transactionType == TransactionType.BORROW) {
    account.borrowCount = account.borrowCount + 1;
    position.borrowCount = position.borrowCount + 1;
    position.balance = position.balance.plus(amount);

    const borrow = new Borrow(eventId);
    borrow.position = position.id;
    borrow.save();

    addAccountToProtocol(transactionType, account, event);

    // repay
  } else if (transactionType == TransactionType.REPAY) {
    account.repayCount = account.repayCount + 1;
    position.repayCount = position.repayCount + 1;
    position.balance = position.balance.minus(amount);

    const repay = new Repay(eventId);
    repay.position = position.id;
    repay.save();
  }

  account.save();
  position.save();

  if (position.balance.equals(BIGINT_ZERO)) {
    closePositionToggle = true;
  }

  createPositionSnapshot(position, event);

  if (closePositionToggle) {
    closePosition(position, account, market, event);
  }
}

export function createDeposit(
  event: ethereum.Event,
  market: Market,
  fCashAmount: BigInt,
  cTokenAmount: BigInt,
  amountUSD: BigDecimal
): Deposit {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const deposit = new Deposit(id);
  const account = getOrCreateAccount(event.transaction.from.toHexString());

  const transactionType = TransactionType.DEPOSIT;

  deposit.hash = event.transaction.hash.toHexString();
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = account.id;
  deposit.market = market.id;
  // deposit.position updated in updatePosition
  deposit.asset = market.inputToken;
  deposit.amount = fCashAmount;
  deposit.amountUSD = amountUSD;

  deposit.save();

  updatePosition(
    market.id,
    transactionType,
    fCashAmount,
    account.id,
    event,
    deposit.id
  );
  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    transactionType
  );
  updateFinancials(event, amountUSD, market.id);
  updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);
  updateTVLAndBalances(event);

  return deposit;
}

export function createWithdraw(
  event: ethereum.Event,
  market: Market,
  fCashAmount: BigInt,
  cTokenAmount: BigInt,
  amountUSD: BigDecimal
): Withdraw {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const withdraw = new Withdraw(id);
  const account = getOrCreateAccount(event.transaction.from.toHexString());
  const transactionType = TransactionType.WITHDRAW;

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  // withdraw.position updated in updatePosition
  withdraw.asset = market.inputToken;
  withdraw.amount = fCashAmount;
  withdraw.amountUSD = amountUSD;

  withdraw.save();

  updatePosition(
    market.id,
    transactionType,
    fCashAmount,
    account.id,
    event,
    withdraw.id
  );
  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    transactionType
  );
  updateFinancials(event, amountUSD, market.id);
  updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);
  updateTVLAndBalances(event);

  return withdraw;
}

export function createBorrow(
  event: ethereum.Event,
  market: Market,
  fCashAmount: BigInt,
  cTokenAmount: BigInt,
  amountUSD: BigDecimal
): Borrow {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const borrow = new Borrow(id);
  const account = getOrCreateAccount(event.transaction.from.toHexString());
  const transactionType = TransactionType.BORROW;

  borrow.hash = event.transaction.hash.toHexString();
  borrow.nonce = event.transaction.nonce;
  borrow.logIndex = event.logIndex.toI32();
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.market = market.id;
  // borrow.position updated in updatePosition
  borrow.asset = market.inputToken;
  borrow.amount = fCashAmount;
  borrow.amountUSD = amountUSD;
  borrow.save();

  updatePosition(
    market.id,
    transactionType,
    fCashAmount,
    account.id,
    event,
    borrow.id
  );
  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    transactionType
  );
  updateFinancials(event, amountUSD, market.id);
  updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);
  updateTVLAndBalances(event);

  return borrow;
}

export function createRepay(
  event: ethereum.Event,
  market: Market,
  fCashAmount: BigInt,
  cTokenAmount: BigInt,
  amountUSD: BigDecimal
): Repay {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const repay = new Repay(id);
  const account = getOrCreateAccount(event.transaction.from.toHexString());
  const transactionType = TransactionType.REPAY;

  repay.hash = event.transaction.hash.toHexString();
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  // repay.position updated in updatePosition
  repay.asset = market.inputToken;
  repay.amount = fCashAmount;
  repay.amountUSD = amountUSD;
  repay.save();

  updatePosition(
    market.id,
    transactionType,
    fCashAmount,
    account.id,
    event,
    repay.id
  );
  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    transactionType
  );
  updateFinancials(event, amountUSD, market.id);
  updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);
  updateTVLAndBalances(event);

  return repay;
}

export function createLiquidate(
  event: ethereum.Event,
  // market: Market,            // market isn't available in liquidation events
  currencyId: i32,
  liquidator: Address,
  liquidatee: Address,
  cTokenAmount: BigInt
): Liquidate {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const token = getTokenFromCurrency(event, currencyId.toString());
  const liquidate = new Liquidate(id);
  const liquidatorAccount = getOrCreateAccount(liquidator.toHexString());
  const liquidateeAccount = getOrCreateAccount(liquidatee.toHexString());

  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidatorAccount.id;
  liquidate.liquidatee = liquidateeAccount.id;

  liquidate.asset = token.id;
  liquidate.amount = bigIntToBigDecimal(cTokenAmount, token.decimals);
  liquidate.amountUSD = liquidate.amount.times(token.lastPriceUSD!);

  // get liquidation discount and set profit
  const notional = Notional.bind(Address.fromString(PROTOCOL_ID));
  const rateStorageCall = notional.try_getRateStorage(currencyId);
  if (rateStorageCall.reverted) {
    log.error(
      "[handleLendBorrowTrade] getRateStorage for currencyId {} reverted",
      [currencyId.toString()]
    );
  } else {
    const liquidationDiscount = BigDecimal.fromString(
      (
        rateStorageCall.value.getEthRate().liquidationDiscount - INT_HUNDRED
      ).toString()
    ).div(BIGDECIMAL_HUNDRED);
    liquidate.profitUSD = liquidate.amountUSD.times(liquidationDiscount);
  }
  liquidate.save();

  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    TransactionType.LIQUIDATEE
  );

  // separate calls for readability
  addAccountToProtocol(TransactionType.LIQUIDATEE, liquidateeAccount, event);
  addAccountToProtocol(TransactionType.LIQUIDATOR, liquidatorAccount, event);

  // BLOCKER: cannot update these metrics without market id
  // updateFinancials(event, amountUSD, market.id);
  // updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);

  return liquidate;
}
