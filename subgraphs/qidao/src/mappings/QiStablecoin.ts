import { store } from "@graphprotocol/graph-ts";
import {
  QiStablecoin,
  OwnershipTransferred,
  DepositCollateral,
  WithdrawCollateral,
  BorrowToken,
  PayBackToken,
  BuyRiskyVault,
} from "../../generated/templates/Vault/QiStablecoin";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { createMaticMarket } from "../entities/market";
import { BIGINT_TEN_THOUSAND } from "../utils/constants";
import { _InProgressLiquidate } from "../../generated/schema";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  createMaticMarket(event);
}

export function handleDepositCollateral(event: DepositCollateral): void {
  createDeposit(event, event.params.amount);
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const liquidate = _InProgressLiquidate.load(
    event.transaction.hash.toHexString()
  );
  if (!liquidate) {
    createWithdraw(event, event.params.amount);
    return;
  }
  createLiquidate(
    event,
    liquidate.debtRepaid!,
    event.params.amount,
    liquidate.closingFee!,
    event.transaction.from,
    liquidate.owner!
  );
  store.remove("_InProgressLiquidate", liquidate.id);
}

export function handleBorrowToken(event: BorrowToken): void {
  createBorrow(event, event.params.amount);
}

export function handlePayBackToken(event: PayBackToken): void {
  const liquidate = _InProgressLiquidate.load(
    event.transaction.hash.toHexString()
  );
  if (!liquidate) {
    createRepay(event, event.params.amount, event.params.closingFee);
    return;
  }
  liquidate.debtRepaid = liquidate.debtRepaid!.plus(event.params.amount);
  liquidate.closingFee = liquidate.closingFee!.plus(event.params.closingFee);
  liquidate.save();
}

export function handleBuyRiskyVault(event: BuyRiskyVault): void {
  const contract = QiStablecoin.bind(event.address);
  const closingFee = event.params.amountPaid
    .times(contract.closingFee())
    .times(contract.getTokenPriceSource())
    .div(contract.getEthPriceSource().times(BIGINT_TEN_THOUSAND));
  const liquidate = new _InProgressLiquidate(
    event.transaction.hash.toHexString()
  );
  liquidate.debtRepaid = event.params.amountPaid;
  liquidate.closingFee = closingFee;
  liquidate.owner = event.params.owner.toHexString();
  liquidate.save();
}
