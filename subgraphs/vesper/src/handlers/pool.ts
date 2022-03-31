import { JSONValue, log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import {
  Deposit,
  Transfer,
  Withdraw,
} from "../../generated/poolV3_vUNI/PoolV3";

function processDeposit(event: Deposit | Transfer): void {
    const vaultAddress = event.address.toHexString();
    let vault = Vault.load(vaultAddress);

    if (!vault) {
        vault = new Vault(vaultAddress);
    }
    log.debug("[deposit params] {}", JSON.stringify(event.params));
};

export function handleDepositV3(event: Deposit): void {
    processDeposit(event);
}
export function handleTransferV3(event: Transfer): void {
    processDeposit(event);
}
export function handleWithdrawV3(event: Withdraw): void {}
