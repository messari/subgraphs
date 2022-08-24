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
  Repay,
  Withdraw,
} from "../../generated/schema";
import {
  ACTIVE_POOL,
  BIGINT_ZERO,
  PositionSide,
  STABILITY_POOL,
  ZERO_ADDRESS,
} from "../utils/constants";
import {
  addMarketBorrowVolume,
  addMarketDepositVolume,
  addMarketLiquidateVolume,
  addMarketRepayVolume,
  addMarketWithdrawVolume,
  getOrCreateMarket,
} from "./market";
import { getETHToken, getLUSDToken } from "./token";
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
} from "./position";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateActiveAccounts,
} from "./usage";

export function createDeposit(
  event: ethereum.Event,
  amountETH: BigInt,
  amountUSD: BigDecimal,
  sender: Address
): void {
  if (amountETH.le(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amountETH.toString()]);
  }
  const market = getOrCreateMarket();
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
  deposit.asset = getETHToken().id;
  deposit.amount = amountETH;
  deposit.amountUSD = amountUSD;
  deposit.save();
  addMarketDepositVolume(event, amountUSD);
  incrementAccountDepositCount(account);
  incrementPositionDepositCount(position);
  incrementProtocolDepositCount(event, account);
}

export function createWithdraw(
  event: ethereum.Event,
  amountETH: BigInt,
  amountUSD: BigDecimal,
  user: Address,
  recipient: Address
): void {
  if (amountETH.le(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amountETH.toString()]);
  }
  const market = getOrCreateMarket();
  const account = getOrCreateAccount(recipient);
  const position = getOrCreateUserPosition(
    event,
    getOrCreateAccount(user),
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
  withdraw.asset = getETHToken().id;
  withdraw.amount = amountETH;
  withdraw.amountUSD = amountUSD;
  withdraw.save();
  addMarketWithdrawVolume(event, amountUSD);
  incrementAccountWithdrawCount(account);
  incrementPositionWithdrawCount(position);
  incrementProtocolWithdrawCount(event, account);
}

export function createBorrow(
  event: ethereum.Event,
  amountLUSD: BigInt,
  amountUSD: BigDecimal,
  recipient: Address
): void {
  if (amountLUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amountLUSD.toString()]);
  }
  const market = getOrCreateMarket();
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
  borrow.asset = getLUSDToken().id;
  borrow.amount = amountLUSD;
  borrow.amountUSD = amountUSD;
  borrow.save();
  addMarketBorrowVolume(event, amountUSD);
  incrementAccountBorrowCount(account);
  incrementPositionBorrowCount(position);
  incrementProtocolBorrowCount(event, account);
}

export function createRepay(
  event: ethereum.Event,
  amountLUSD: BigInt,
  amountUSD: BigDecimal,
  user: Address,
  repayer: Address
): void {
  if (amountLUSD.le(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amountLUSD.toString()]);
  }
  const market = getOrCreateMarket();
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
  repay.asset = getLUSDToken().id;
  repay.amount = amountLUSD;
  repay.amountUSD = amountUSD;
  repay.save();
  addMarketRepayVolume(event, amountUSD);
  incrementAccountRepayCount(account);
  incrementPositionRepayCount(position);
  incrementProtocolRepayCount(event, account);
}

export function createLiquidate(
  event: ethereum.Event,
  amountLiquidated: BigInt,
  amountLiquidatedUSD: BigDecimal,
  profitUSD: BigDecimal,
  user: Address,
  liquidator: Address
): void {
  const market = getOrCreateMarket();
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
  liquidate.asset = getLUSDToken().id;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountLiquidatedUSD;
  liquidate.profitUSD = profitUSD;
  liquidate.save();
  addMarketLiquidateVolume(event, amountLiquidatedUSD);
  incrementAccountLiquidationCount(account);
  incrementPositionLiquidationCount(borrowerPosition);
  incrementPositionLiquidationCount(lenderPosition);
  incrementAccountLiquidatorCount(liquidatorAccount);
  incrementProtocolLiquidateCount(event, account, liquidatorAccount);
}
