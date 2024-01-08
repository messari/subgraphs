import { Address, dataSource, store } from "@graphprotocol/graph-ts";

import {
  createMaticMarket,
  getOrCreateLendingProtocol,
  getOrCreateToken,
} from "../common/getters";
import {
  BIGINT_TEN_THOUSAND,
  MAI_TOKEN_ADDRESS,
  MATIC_ADDRESS,
} from "../utils/constants";
import { uppercaseNetwork } from "../utils/strings";
import {
  helperBorrowToken,
  helperDepositCollateral,
  helperLiquidateVault,
  helperPayBackToken,
  helperWithdrawCollateral,
} from "./helpers";

import {
  BorrowToken,
  BuyRiskyVault,
  DepositCollateral,
  OwnershipTransferred,
  PayBackToken,
  QiStablecoin,
  WithdrawCollateral,
} from "../../generated/templates/Vault/QiStablecoin";
import { _InProgressLiquidate } from "../../generated/schema";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const token = getOrCreateToken(MATIC_ADDRESS, event, event.address);
  const borrowToken = getOrCreateToken(
    Address.fromString(
      MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()))
    ),
    event
  );
  const protocol = getOrCreateLendingProtocol(event);

  createMaticMarket(protocol, token, borrowToken, event);

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

export function handleBuyRiskyVault(event: BuyRiskyVault): void {
  const amount = event.params.amountPaid;
  const contract = QiStablecoin.bind(event.address);
  const closingFee = amount
    .times(contract.closingFee())
    .times(contract.getTokenPriceSource())
    .div(contract.getEthPriceSource().times(BIGINT_TEN_THOUSAND));
  const liquidate = new _InProgressLiquidate(
    event.transaction.hash.toHexString()
  );
  liquidate.debtRepaid = amount;
  liquidate.closingFee = closingFee;
  liquidate.owner = event.params.owner.toHexString();
  liquidate.save();
}

export function handlePayBackToken(event: PayBackToken): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const closingFee = event.params.closingFee;
  const from = event.transaction.from;

  const liquidate = _InProgressLiquidate.load(
    event.transaction.hash.toHexString()
  );
  if (!liquidate) {
    helperPayBackToken(marketId, amount, closingFee, from, event);
    return;
  }
  liquidate.debtRepaid = liquidate.debtRepaid!.plus(amount);
  liquidate.closingFee = liquidate.closingFee!.plus(closingFee);
  liquidate.save();
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;
  const liquidate = _InProgressLiquidate.load(
    event.transaction.hash.toHexString()
  );
  if (!liquidate) {
    helperWithdrawCollateral(marketId, amount, from, event);
    return;
  }

  const debtRepaid = liquidate.debtRepaid!;
  const closingFee = liquidate.closingFee!;
  const liquidator = Address.fromString(liquidate.owner!);
  const liquidatee = from;
  helperLiquidateVault(
    marketId,
    amount,
    debtRepaid,
    closingFee,
    liquidator,
    liquidatee,
    event
  );
  store.remove("_InProgressLiquidate", liquidate.id);
}
