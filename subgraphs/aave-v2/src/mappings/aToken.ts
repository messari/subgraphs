import { log } from "@graphprotocol/graph-ts";
import { updateOutputTokenSupply } from "../common/utils";
import { Burn, Mint } from "../../generated/templates/AToken/AToken";

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// The mint/burn handlers are essentially extensions of deposit/withdraw events to manage the aToken/outputToken

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  log.info("[ATokenMint] Txn: {}, From: {}", [
    event.transaction.hash.toHexString(),
    event.params.from.toHexString(),
  ]);
  updateOutputTokenSupply(event);
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  log.info("[ATokenBurm] Txn: {}, From: {}", [
    event.transaction.hash.toHexString(),
    event.params.from.toHexString(),
  ]);
  updateOutputTokenSupply(event);
}
