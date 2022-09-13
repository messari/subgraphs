import {
  BorrowToken,
  DepositCollateral,
  LiquidateVault,
  OwnershipTransferred,
  PayBackToken,
  WithdrawCollateral,
} from "../../generated/templates/Vault/erc20QiStablecoin";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { createERC20Market } from "../entities/market";

export function handleBorrowToken(event: BorrowToken): void {
  createBorrow(event, event.params.amount);
}

export function handleDepositCollateral(event: DepositCollateral): void {
  createDeposit(event, event.params.amount);
}

export function handleLiquidateVault(event: LiquidateVault): void {
  createLiquidate(
    event,
    event.params.debtRepaid,
    event.params.collateralLiquidated,
    event.params.closingFee,
    event.params.buyer,
    event.params.owner.toHexString()
  );
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  createERC20Market(event);
}

export function handlePayBackToken(event: PayBackToken): void {
  createRepay(event, event.params.amount, event.params.closingFee);
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  createWithdraw(event, event.params.amount);
}
