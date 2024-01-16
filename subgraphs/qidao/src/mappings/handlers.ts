import { Address, dataSource } from "@graphprotocol/graph-ts";

import {
  createERC20Market,
  getOrCreateLendingProtocol,
  getOrCreateToken,
} from "../common/getters";
import { MAI_TOKEN_ADDRESS } from "../utils/constants";
import { uppercaseNetwork } from "../utils/strings";
import {
  helperBorrowToken,
  helperDepositCollateral,
  helperLiquidateVault,
  helperPayBackToken,
  helperUpdatedInterestRate,
  helperWithdrawCollateral,
} from "./helpers";

import {
  BorrowToken,
  DepositCollateral,
  ERC20QiStablecoin,
  LiquidateVault,
  OwnershipTransferred,
  PayBackToken,
  WithdrawCollateral,
  UpdatedInterestRate,
} from "../../generated/templates/Vault/ERC20QiStablecoin";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const contract = ERC20QiStablecoin.bind(event.address);
  const token = getOrCreateToken(contract.collateral(), event, event.address);
  const borrowToken = getOrCreateToken(
    Address.fromString(
      MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()))
    ),
    event
  );
  const protocol = getOrCreateLendingProtocol(event);

  createERC20Market(protocol, token, borrowToken, event);

  protocol.save();
}

export function handleDepositCollateral(event: DepositCollateral): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

  helperDepositCollateral(marketId, amount, from, event);
}

export function handleBorrowToken(event: BorrowToken): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

  helperBorrowToken(marketId, amount, from, event);
}

export function handlePayBackToken(event: PayBackToken): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const closingFee = event.params.closingFee;
  const from = event.transaction.from;

  helperPayBackToken(marketId, amount, closingFee, from, event);
}

export function handleLiquidateVault(event: LiquidateVault): void {
  const marketId = event.address;
  const amount = event.params.collateralLiquidated;
  const debtRepaid = event.params.debtRepaid;
  const closingFee = event.params.closingFee;
  const liquidator = event.params.buyer;
  const liquidatee = event.params.owner;

  helperLiquidateVault(
    marketId,
    amount,
    debtRepaid,
    closingFee,
    liquidator,
    liquidatee,
    event
  );
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

  helperWithdrawCollateral(marketId, amount, from, event);
}

export function handleUpdatedInterestRate(event: UpdatedInterestRate): void {
  const marketId = event.address;
  const interestRate = event.params.interestRate;

  helperUpdatedInterestRate(marketId, interestRate);
}
