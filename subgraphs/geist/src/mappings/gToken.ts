import { Burn, Mint } from "../../generated/templates/GToken/GToken";

import { updateOutputTokenSupply } from "./helpers";

import { log } from "@graphprotocol/graph-ts";

export function handleGTokenMint(event: Mint): void {
  // Event handler for GToken mints. This gets triggered upon deposits
  log.info("Minting gToken from={}, tx from={}, address={}", [
    event.params.from.toHexString(),
    event.transaction.from.toHexString(),
    event.address.toHexString(),
  ]);
  updateOutputTokenSupply(event);
}

export function handleGTokenBurn(event: Burn): void {
  // Event handler for GToken burns. This gets triggered upon withdraws
  log.info("Burning gToken from={}, tx from={}, address={}", [
    event.params.from.toHexString(),
    event.transaction.from.toHexString(),
    event.address.toHexString(),
  ]);
  updateOutputTokenSupply(event);
}
