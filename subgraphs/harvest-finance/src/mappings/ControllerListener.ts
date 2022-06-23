import { log } from "@graphprotocol/graph-ts";
import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../../generated/ControllerListener/ControllerContract";
import { StrategyListener } from "../../generated/templates";
import { vaults } from "../modules";

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void { }

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {

	let vault = vaults.loadOrCreateVault(call.inputs._vault)
	vault.save()

	StrategyListener.create(call.inputs._strategy)

}