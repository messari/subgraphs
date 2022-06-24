import { log } from "@graphprotocol/graph-ts";
import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../../generated/ControllerListener/ControllerContract";
import { Token } from "../../generated/schema";
import { StrategyListener } from "../../generated/templates";
import { vaults } from "../modules";

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void { }

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {

	let vault = vaults.loadOrCreateVault(call.inputs._vault)
	let vaultResults = vaults.getValuesForVault(call.inputs._vault)
	vault.symbol = vaultResults.symbol
	vault.name = vaultResults.name
	vault.save()

	StrategyListener.create(call.inputs._strategy)

}