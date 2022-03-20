import { Address } from "@graphprotocol/graph-ts";
import {
  AccrueInterest as AccrueInterestEvent,
  Borrow as BorrowEvent,
  LiquidateBorrow as LiquidateBorrowEvent,
  Mint as MintEvent,
  Redeem as RedeemEvent,
  RepayBorrow as RepayBorrowEvent,
} from "../generated/BenqiTokenqiAVAX/BenqiTokenqi";
import { 
  handleborrowTransactions,
  handlerepayTransactions,
  handleWithDrawTransactions,
  handleDepositTransactions,
  handleLiquidTransaction, 
  handleAccrueInterest,
} from "./handlers";


export function borrowTransactions(event: BorrowEvent): void {
  handleborrowTransactions(
    event.transaction.hash,
    event.logIndex,
    event.params.borrower,
    event.transaction.from,
    event.block.number,
    event.block.timestamp,
    event.address,
    event.params.borrowAmount,
  );
}

export function repayTransactions(event: RepayBorrowEvent): void {
  handlerepayTransactions(
    event.transaction.hash,
    event.logIndex,
    event.params.borrower,
    event.params.payer,
    event.block.number,
    event.block.timestamp,
    event.address,
    event.params.repayAmount,
  );
}

export function withDrawTransactions(event: RedeemEvent): void {
  handleWithDrawTransactions(
    event.transaction.hash,
    event.logIndex,
    event.params.redeemer,
    event.block.number,
    event.block.timestamp,
    event.address,
    event.params.redeemAmount,
  );
}
export function DepositTransactions(event: MintEvent): void {
  handleDepositTransactions(
    event.transaction.hash,
    event.logIndex,
    event.params.minter,
    event.block.number,
    event.block.timestamp,
    event.address,
    event.params.mintAmount,
  );
}

export function liquidTransactions(event: LiquidateBorrowEvent): void {
  handleLiquidTransaction(
    event.transaction.hash,
    event.logIndex,
    event.params.borrower,
    event.params.liquidator,
    event.block.number,
    event.block.timestamp,
    event.address,
    event.transaction.value,
    event.params.seizeTokens,
    event.params.repayAmount,
  );
}

export function accrueInterest(event: AccrueInterestEvent): void {
  handleAccrueInterest(
    event.address,
    event.params.interestAccumulated,
    event.block.timestamp,
    event.block.number,
  )
}
