// map blockchain data to entities outlined in schema.graphql

import { Address, log } from "@graphprotocol/graph-ts";
import { YIELD_MANAGER_ADDRESS, YIELD_VAULT_ADDRESS, ZERO_ADDRESS } from "../common/utils/constants";
import { Deposit, RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { createDeposit } from "./helpers";
import { Withdraw } from "../../generated/schema";

export function handleYieldDeposit(event: Deposit): void {
  // get address of asset
  let contract = RariYieldFundManager.bind(Address.fromString(YIELD_MANAGER_ADDRESS));
  let tryToken = contract.try_getAcceptedCurrencies();
  log.warning("currency code: {} transaction hash {}", [event.params.currencyCode.toHexString(), event.transaction.hash.toHexString()]);

  createDeposit(
    event,
    event.params.amount,
    event.params.amountUsd,
    Address.fromString(ZERO_ADDRESS), // TODO: change
    YIELD_VAULT_ADDRESS,
  );
  // TODO: add snapshot functions
}

export function handleYieldWithdrawal(event: Withdraw): void {}
