import { Deposit } from "../../generated/ControllerListener/VaultContract";
import { accounts, vaults } from "../modules";

export function handleDeposit(event: Deposit): void {

	let account = accounts.loadOrCreateActiveAccount(event.params.beneficiary)
	account.save()
	// Increase protocl users

	let vault = vaults.loadOrCreateVault(event.address.toHexString())
	vault.save()
}

export function handleStrategyAnnounced(): void { }
export function handleStrategyChanged(): void { }
export function handleDoHardWorkCall(): void { }
