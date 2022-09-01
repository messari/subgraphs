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
  cDAI_ADDRESS,
  cETH_ADDRESS,
  cUSDC_ADDRESS,
  cWBTC_ADDRESS,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  SECONDS_PER_DAY,
  TransactionType,
  InterestRateSide,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { addAccountToProtocol, updateUsageMetrics } from "./usageMetrics";
import { getOrCreateLendingProtocol } from "../getters/protocol";
import { getOrCreateToken } from "../getters/token";
import { getOrCreateAccount } from "../getters/account";
import { getOrCreateMarket } from "../getters/market";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "../common/arrays";
import { updateFinancials, updateMarket, updateTVL } from "./financialMetrics";
import { getTokenFromCurrency } from "../common/util";

export function getOrCreatePosition(
  event: ethereum.Event,
  account: Account,
  market: Market,
  side: string
): Position {
  const accountId = account.id;
  const marketId = market.id;
  let positionIdPrefix = `${accountId}-${marketId}-${side}`;

  for (let curr = 0; curr < account.openPositionCount; curr += 1) {
    let op = account.openPositions.at(curr);
    if (op.startsWith(positionIdPrefix)) {
      log.error(" ----- Found position with prefix... {}", [
        Position.load(op)!.id,
      ]);
      return Position.load(op)!;
    }
  }

  let count = 0;
  for (let curr = 0; curr < account.closedPositionCount; curr += 1) {
    let cp = account.closedPositions.at(curr);
    if (cp.startsWith(positionIdPrefix)) {
      count += 1;
    }
  }

  let positionId = `${accountId}-${market.id}-${side}-${count}`;
  let position = new Position(positionId);

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

  let protocol = getOrCreateLendingProtocol();
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

  // Counts
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
  let account_index = account.openPositions.indexOf(position.id);
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

  let protocol = getOrCreateLendingProtocol();
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
  let hash = event.transaction.hash.toHexString();
  let txlogIndex = event.transactionLogIndex.toI32();
  let snapshot = new PositionSnapshot(`${position.id}-${hash}-${txlogIndex}`);

  snapshot.position = position.id;
  snapshot.hash = hash;
  snapshot.logIndex = txlogIndex;
  // snapshot.nonce = event.transaction.nonce;
  snapshot.nonce = BIGINT_ZERO;
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
  eventId: string,
  liquidation: boolean = false
): void {
  let closePositionToggle = false;

  let account = getOrCreateAccount(accountId, event);
  let market = getOrCreateMarket(event, marketId);

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

  let position = getOrCreatePosition(event, account, market, side!);

  // deposit
  if (transactionType == TransactionType.DEPOSIT) {
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;
    position.balance = position.balance.plus(amount);

    let deposit = new Deposit(eventId);
    deposit.position = position.id;
    deposit.save();
    addAccountToProtocol(transactionType, account, event);

    // withdraw
  } else if (transactionType == TransactionType.WITHDRAW) {
    account.withdrawCount = account.withdrawCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    position.balance = position.balance.minus(amount);

    // TODO: Liquidation: TBD if we need this
    // if (liquidation) {
    //   position.liquidationCount = position.liquidationCount + 1;
    //   let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionlogIndex
    //     .plus(BIGINT_ONE)
    //     .toString()}`;
    //   // updateLiqudationEvent(liqudationEventId, position.id);
    // }

    let withdraw = new Withdraw(eventId);
    withdraw.position = position.id;
    withdraw.save();

    if (position.balance.equals(BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  } else if (transactionType == TransactionType.BORROW) {
    account.borrowCount = account.borrowCount + 1;
    position.borrowCount = position.borrowCount + 1;
    position.balance = position.balance.plus(amount);

    let borrow = new Borrow(eventId);
    borrow.position = position.id;
    borrow.save();

    addAccountToProtocol(transactionType, account, event);

    // repay
  } else if (transactionType == TransactionType.REPAY) {
    account.repayCount = account.repayCount + 1;
    position.repayCount = position.repayCount + 1;
    position.balance = position.balance.minus(amount);

    // TODO: Liquidation: TBD if we need this
    // if (liquidation) {
    //   position.liquidationCount = position.liquidationCount + 1;
    //   let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionlogIndex.toString()}`;
    //   updateLiqudationEvent(liqudationEventId, position.id);
    // }

    let repay = new Repay(eventId);
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
  let deposit = new Deposit(id);
  const account = getOrCreateAccount(
    event.transaction.from.toHexString(),
    event
  );

  let transactionType = TransactionType.DEPOSIT;

  deposit.hash = event.transaction.hash.toHexString();
  // deposit.nonce = event.transaction.
  deposit.nonce = BIGINT_ZERO;
  deposit.logIndex = event.logIndex.toI32();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = account.id;
  deposit.market = market.id;
  // updated in updatePosition
  // deposit.position = position.id;
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
  updateTVL(event);

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
  let withdraw = new Withdraw(id);
  const account = getOrCreateAccount(
    event.transaction.from.toHexString(),
    event
  );

  let transactionType = TransactionType.WITHDRAW;

  withdraw.hash = event.transaction.hash.toHexString();
  // withdraw.nonce = event.transaction.nonce;
  withdraw.nonce = BIGINT_ZERO;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  // updated in updatePosition
  // withdraw.position = position.id;
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
  updateTVL(event);

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
  let borrow = new Borrow(id);

  const account = getOrCreateAccount(
    event.transaction.from.toHexString(),
    event
  );

  let transactionType = TransactionType.BORROW;

  borrow.hash = event.transaction.hash.toHexString();
  // borrow.nonce = event.transaction.nonce;
  borrow.nonce = BIGINT_ZERO;
  borrow.logIndex = event.logIndex.toI32();
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.market = market.id;
  // updated in updatePosition
  // borrow.position = position.id;
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
  updateTVL(event);

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
  let repay = new Repay(id);

  const account = getOrCreateAccount(
    event.transaction.from.toHexString(),
    event
  );

  let transactionType = TransactionType.REPAY;

  repay.hash = event.transaction.hash.toHexString();
  // repay.nonce = event.transaction.nonce;
  repay.nonce = BIGINT_ZERO;
  repay.logIndex = event.logIndex.toI32();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  // updated in updatePosition
  // repay.position = position.id;
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
  updateTVL(event);

  return repay;
}

export function createLiquidate(
  event: ethereum.Event,
  market: Market,
  liquidator: Address,
  liquidatee: Address,
  cTokenAmount: BigInt
): Liquidate {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let liquidate = new Liquidate(id);
  let liquidatorAccount = getOrCreateAccount(liquidator.toHexString(), event);
  let liquidateeAccount = getOrCreateAccount(liquidatee.toHexString(), event);

  liquidate.hash = event.transaction.hash.toHexString();
  // liquidate.nonce = event.transaction.nonce;
  liquidate.nonce = BIGINT_ZERO;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidatorAccount.id;
  liquidate.liquidatee = liquidateeAccount.id;
  liquidate.market = market.id;
  // TODO: The liquidation events don't provide maturity so we are unable to associate a market with the liquidation event.
  liquidate.position = getOrCreatePosition(
    event,
    liquidateeAccount,
    market,
    InterestRateSide.BORROWER
  ).id;
  liquidate.asset = market.inputToken;

  let currencyId = market.id.split("-")[0];
  let token = getTokenFromCurrency(event, currencyId);

  liquidate.amount = bigIntToBigDecimal(cTokenAmount, token.decimals);
  liquidate.amountUSD = liquidate.amount.times(token.lastPriceUSD!);
  liquidate.profitUSD = BIGDECIMAL_ZERO;

  liquidate.save();

  updateUsageMetrics(
    event,
    event.transaction.from,
    event.transaction.to!,
    TransactionType.LIQUIDATEE
  );
  // TODO: Should this be elsewhere?
  addAccountToProtocol(TransactionType.LIQUIDATEE, liquidateeAccount, event);
  addAccountToProtocol(TransactionType.LIQUIDATOR, liquidatorAccount, event);

  // TODO: cannot update these metrics without market id
  // updateFinancials(event, amountUSD, market.id);
  // updateMarket(market.id, transactionType, cTokenAmount, amountUSD, event);
  // updateTVL(event);

  return liquidate;
}
