import { JSONValue, log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import {
  Deposit,
  Transfer,
  Withdraw,
} from "../../generated/poolV3_vUNI/PoolV3";

export function handleDepositV3(event: Deposit): void {
  const vaultAddress = event.address.toHexString();
  let vault = Vault.load(vaultAddress);

  if (!vault) {
    vault = new Vault(vaultAddress);
  }
  log.debug("[deposit params] Amount : {}", [event.params.amount.toString()]);
}
export function handleTransferV3(event: Transfer): void {
  const vaultAddress = event.address.toHexString();
  let vault = Vault.load(vaultAddress);

  if (!vault) {
    vault = new Vault(vaultAddress);
  }
  log.debug("[deposit params] Amount : {}", [event.params.value.toString()]);
}
export function handleWithdrawV3(event: Withdraw): void {}
