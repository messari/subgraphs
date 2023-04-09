import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  dataSource,
  log,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  Deposit
} from "../../generated/Vault/Vault"

export function handleLockIn(event: Deposit): void {
  log.warning("transaction hash: {} Block number: {}", [
    event.transaction.hash.toHexString(),
    event.block.number.toString(),
  ]);
}


