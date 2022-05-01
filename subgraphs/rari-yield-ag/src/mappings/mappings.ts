// map blockchain data to entities outlined in schema.graphql

import { Address, log } from "@graphprotocol/graph-ts";
import { YIELD_MANAGER_ADDRESS, YIELD_VAULT_ADDRESS, ZERO_ADDRESS } from "../common/utils/constants";
import { Deposit, RariYieldFundManager, Withdrawal } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { createDeposit, createWithdraw } from "./helpers";

export function handleYieldDeposit(event: Deposit): void {
  // get address of asset
  log.warning("currency code: {} transaction hash {}", [
    event.params.currencyCode.toHexString(),
    event.transaction.hash.toHexString(),
  ]);

  createDeposit(
    event,
    event.params.amount,
    event.params.amountUsd,
    Address.fromString(ZERO_ADDRESS), // TODO: change
    YIELD_VAULT_ADDRESS,
    event.params.currencyCode.toHexString(),
  );
  // TODO: add snapshot functions
}

export function handleYieldWithdrawal(event: Withdrawal): void {
  createWithdraw(
    event,
    event.params.amount,
    event.params.amountUsd,
    Address.fromString(ZERO_ADDRESS),
    YIELD_VAULT_ADDRESS,
    event.params.currencyCode.toHexString(),
  );
}
