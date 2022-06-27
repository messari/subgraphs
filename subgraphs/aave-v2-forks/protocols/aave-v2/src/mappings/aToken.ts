import { log } from "@graphprotocol/graph-ts";
import { updateOutputTokenSupply } from "../common/utils";
import { Burn, Mint, Transfer } from "../../../../generated/templates/AToken/AToken";
import { ZERO_ADDRESS } from "../common/constants";

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// The mint/burn handlers are essentially extensions of deposit/withdraw events to manage the aToken/outputToken

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  log.warning("[ATokenMint] Txn: {}, From: {}", [
    event.transaction.hash.toHexString(),
    event.params.from.toHexString(),
  ]);
  updateOutputTokenSupply(event);
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  log.info("[ATokenBurm] Txn: {}, From: {}", [event.transaction.hash.toHexString(), event.params.from.toHexString()]);
  updateOutputTokenSupply(event);
}

export function handleATokenTransfer(event: Transfer): void {
  // Event handler for AToken transfers. This gets triggered upon transfers
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    log.warning("[ATokenTransfer] Txn: {}, amount: {}", [
      event.transaction.hash.toHexString(),
      event.params.value.toString(),
    ]);
  }
}
