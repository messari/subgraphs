// map blockchain data to entities outlined in schema.graphql

import { Address, log } from "@graphprotocol/graph-ts";
import {
  YIELD_TOKEN_MAPPING,
  YIELD_VAULT_ADDRESS,
  YIELD_VAULT_MANAGER_ADDRESS,
  ZERO_ADDRESS,
} from "../common/utils/constants";
import { Deposit, RariYieldFundManager, Withdrawal } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { createDeposit, createWithdraw } from "./helpers";

export function handleYieldDeposit(event: Deposit): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createDeposit(event, event.params.amount, event.params.amountUsd, assetAddress, YIELD_VAULT_ADDRESS);
  // TODO: add snapshot functions
}

export function handleYieldWithdrawal(event: Withdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createWithdraw(event, event.params.amount, event.params.amountUsd, assetAddress, YIELD_VAULT_ADDRESS);
}
