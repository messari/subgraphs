import {
  NewVault,
  NewExperimentalVault,
} from "../../generated/Registry_v1/Registry_v1";
import { log } from "@graphprotocol/graph-ts";
import { getOrCreateVault } from "../common/initializers";

export function handleNewVault(event: NewVault): void {
  const vaultAddress = event.params.vault;
  const tokenAddress = event.params.token;
  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[NewVault] - VaultId: {}, TokenId: {}, TxHash: {}", [
    vault.id,
    tokenAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleNewExperimentalVault(event: NewExperimentalVault): void {
  const vaultAddress = event.params.vault;
  const tokenAddress = event.params.token;
  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[NewExperimentalVault] - VaultId: {}, TokenId: {}, TxHash: {}", [
    vault.id,
    tokenAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
