import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Repay,
  Token,
  Withdraw,
} from "../../generated/schema";
import { BIGINT_ZERO, PositionSide } from "../utils/constants";
import {
  addMarketBorrowVolume,
  addMarketDepositVolume,
  addMarketLiquidateVolume,
  addMarketRepayVolume,
  addMarketWithdrawVolume,
} from "./market";
import { prefixID } from "../utils/strings";
import {
  getOrCreateAccount,
  incrementAccountBorrowCount,
  incrementAccountDepositCount,
  incrementAccountLiquidationCount,
  incrementAccountLiquidatorCount,
  incrementAccountRepayCount,
  incrementAccountWithdrawCount,
} from "./account";
import {
  getOrCreateUserPosition,
  incrementPositionBorrowCount,
  incrementPositionDepositCount,
  incrementPositionLiquidationCount,
  incrementPositionRepayCount,
  incrementPositionWithdrawCount,
  updateUserPositionBalances,
} from "./position";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
} from "./usage";

export function createDeposit(
  event: ethereum.Event,
  market: Market,
  asset: Token,
  amount: BigInt,
  amountUSD: BigDecimal,
  sender: Address
): void {
  if (amount.lt(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amount.toString()]);
  }
  const account = getOrCreateAccount(sender);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  const deposit = new Deposit(
    prefixID(
      "deposit",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = account.id;
  deposit.market = market.id;
  deposit.position = position.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD;
  deposit.save();
  addMarketDepositVolume(event, amountUSD, market);
  incrementAccountDepositCount(account);
  incrementPositionDepositCount(position);
  incrementProtocolDepositCount(event, account);
  updateUserPositionBalances(event, account, amount, market, position);
}

export function createWithdraw(
  event: ethereum.Event,
  market: Market,
  asset: Token,
  amountToken: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountToken.lt(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amountToken.toString()]);
  }
  const account = getOrCreateAccount(recipient);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  const withdraw = new Withdraw(
    prefixID(
      "withdraw",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  withdraw.position = position.id;
  withdraw.asset = asset.id;
  withdraw.amount = amountToken;
  withdraw.amountUSD = amountUSD;
  withdraw.save();
  addMarketWithdrawVolume(event, amountUSD, market);
  incrementAccountWithdrawCount(account);
  incrementPositionWithdrawCount(position);
  incrementProtocolWithdrawCount(event, account);
  updateUserPositionBalances(
    event,
    account,
    amountToken.times(BigInt.fromString("-1")),
    market,
    position
  );
}

export function createBorrow(
  event: ethereum.Event,
  market: Market,
  asset: Token,
  amountToken: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountToken.lt(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amountToken.toString()]);
  }
  const account = getOrCreateAccount(recipient);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  const borrow = new Borrow(
    prefixID(
      "borrow",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.nonce = event.transaction.nonce;
  borrow.logIndex = event.logIndex.toI32();
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.market = market.id;
  borrow.position = position.id;
  borrow.asset = asset.id;
  borrow.amount = amountToken;
  borrow.amountUSD = amountUSD;
  borrow.save();
  addMarketBorrowVolume(event, amountUSD, market);
  incrementAccountBorrowCount(account);
  incrementPositionBorrowCount(position);
  incrementProtocolBorrowCount(event, account);
  updateUserPositionBalances(event, account, amountToken, market, position);
}

export function createRepay(
  event: ethereum.Event,
  market: Market,
  asset: Token,
  amountToken: BigInt,
  amountUSD: BigDecimal,
  user: Address,
  repayer: Address
): void {
  if (amountToken.lt(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amountToken.toString()]);
  }
  const account = getOrCreateAccount(repayer);
  const position = getOrCreateUserPosition(
    event,
    getOrCreateAccount(user),
    market,
    PositionSide.BORROWER
  );
  const repay = new Repay(
    prefixID(
      "repay",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  repay.position = position.id;
  repay.asset = asset.id;
  repay.amount = amountToken;
  repay.amountUSD = amountUSD;
  repay.save();
  addMarketRepayVolume(event, amountUSD, market);
  incrementAccountRepayCount(account);
  incrementPositionRepayCount(position);
  incrementProtocolRepayCount(event, account);
  updateUserPositionBalances(
    event,
    account,
    amountToken.times(BigInt.fromString("-1")),
    market,
    position
  );
}

export function createLiquidate(
  event: ethereum.Event,
  market: Market,
  asset: Token,
  amountLiquidatedBorrow: BigInt,
  amountLiquidatedLender: BigInt,
  amountLiquidatedUSD: BigDecimal,
  user: Address,
  liquidator: Address,
  profitUSD: BigDecimal
): void {
  const account = getOrCreateAccount(user);
  const liquidatorAccount = getOrCreateAccount(liquidator);
  const lenderPosition = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  const borrowerPosition = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  const liquidate = new Liquidate(
    prefixID(
      "liquidate",
      `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    )
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.liquidatee = liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidatorAccount.id;
  liquidate.liquidatee = account.id;
  liquidate.market = market.id;
  liquidate.position = borrowerPosition.id;
  liquidate.lenderPosition = lenderPosition.id;
  liquidate.asset = asset.id;
  liquidate.amount = amountLiquidatedBorrow;
  liquidate.amountUSD = amountLiquidatedUSD;
  liquidate.profitUSD = profitUSD;
  liquidate.save();
  addMarketLiquidateVolume(event, amountLiquidatedUSD, market);
  incrementAccountLiquidationCount(account);
  incrementPositionLiquidationCount(borrowerPosition);
  incrementPositionLiquidationCount(lenderPosition);
  incrementAccountLiquidatorCount(liquidatorAccount);
  incrementProtocolLiquidateCount(event, account, liquidatorAccount);
  updateUserPositionBalances(
    event,
    account,
    amountLiquidatedBorrow.times(BigInt.fromString("-1")),
    market,
    borrowerPosition
  );
  updateUserPositionBalances(
    event,
    account,
    amountLiquidatedLender.times(BigInt.fromString("-1")),
    market,
    lenderPosition
  );
}
