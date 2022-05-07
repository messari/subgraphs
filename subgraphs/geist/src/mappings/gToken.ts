import { Burn, Mint } from "../../generated/templates/GToken/GToken";

import { updateOutputTokenSupply } from "./helpers";

import { log } from "@graphprotocol/graph-ts";

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// The mint/burn handlers are essentially extensions of deposit/withdraw events to manage the aToken/outputToken

export function handleGTokenMint(event: Mint): void {
  // Event handler for GToken mints. This gets triggered upon deposits
  log.info(
    event.params.from.toHexString() +
      " " +
      event.transaction.from.toHexString() +
      " MINTING gTOKEN: " +
      event.address.toHexString(),
    []
  );
  updateOutputTokenSupply(event);
}

export function handleGTokenBurn(event: Burn): void {
  // Event handler for GToken burns. This gets triggered upon withdraws
  log.info(
    event.params.from.toHexString() +
      " " +
      event.transaction.from.toHexString() +
      " BURNING gTOKEN: " +
      event.address.toHexString(),
    []
  );
  updateOutputTokenSupply(event);
}
