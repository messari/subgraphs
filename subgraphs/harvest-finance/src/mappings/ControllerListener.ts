import { log } from "@graphprotocol/graph-ts";
import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../../generated/ControllerListener/ControllerContract";
import { Token } from "../../generated/schema";
import { StrategyListener } from "../../generated/templates";
import { shared, tokens, vaults } from "../modules";

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void { }

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {

	let vault = vaults.loadOrCreateVault(call.inputs._vault)
	let vaultResults = vaults.getValuesForVault(call.inputs._vault)
	vault.symbol = vaultResults.symbol
	vault.name = vaultResults.name


	let underLyingToken = tokens.setValuesForToken(
		tokens.loadOrCreateToken(vaultResults.underLyingToken),
		tokens.getValuesForToken(vaultResults.underLyingToken)
	)
	underLyingToken.save()

	// TODO: I don't understand this
	// TODO: if (symbol == 'fUNI-V2') {

	let fToken = tokens.setValuesForToken(
		tokens.loadOrCreateToken(call.inputs._vault),
		tokens.getValuesForToken(call.inputs._vault)
	)
	fToken.save()

	vault.name = shared.constants.PROTOCOL_NAME + ' - ' + underLyingToken.name;
	vault.inputToken = underLyingToken.id
	vault.outputToken = fToken.id
	vault.save()

	StrategyListener.create(call.inputs._strategy)

}