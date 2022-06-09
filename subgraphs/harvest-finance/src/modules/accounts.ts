import { Address } from "@graphprotocol/graph-ts"
import { Account } from "../../generated/schema"

export namespace accounts {

	export function parseAccountId(id: Address): string {
		return id.toHexString()
	}
	// this function can be less verbose but it's better to keep consistency
	export function loadOrCreateAccount(address: Address): Account {
		let id = parseAccountId(address)
		let entity = Account.load(id)
		if (entity == null) {
			entity = new Account(id)
		}
		return entity as Account
	}
}