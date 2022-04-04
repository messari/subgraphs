import { log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import { Transfer, Withdraw } from "../../generated/poolV3_vUNI/PoolV3";
export function handleTransferV3(event: Transfer): void {
  const vaultAddress = event.params.to.toHexString();
  let vault = Vault.load(vaultAddress);

  if (!vault) {
    vault = new Vault(vaultAddress);
  }

  log.debug("[deposit params] Amount : {}", [event.params.value.toString()]);
}
export function handleWithdrawV3(event: Withdraw): void {}

export function handleBlockV3(): void {}
