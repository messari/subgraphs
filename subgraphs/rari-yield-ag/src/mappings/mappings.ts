// map blockchain data to entities outlined in schema.graphql

import { Address } from "@graphprotocol/graph-ts";
import { YIELD_MANAGER_ADDRESS, YIELD_VAULT_ADDRESS, ZERO_ADDRESS } from "../common/utils/constants";
import { Deposit, RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { createDeposit } from "./helpers";
import { Withdraw } from "../../generated/schema";

export function handleYieldDeposit(event: Deposit): void {
  // get address of asset
  //    let contract = new RariYieldFundManager(Address.fromString(YIELD_MANAGER_ADDRESS));

  createDeposit(
    event,
    event.params.amount,
    event.params.amountUsd,
    Address.fromString(ZERO_ADDRESS), // TODO: change
    YIELD_VAULT_ADDRESS,
  );
  // TODO: add snapshot functions
}

export function handleYieldWithdrawal(event: Withdraw): void {
    
}
