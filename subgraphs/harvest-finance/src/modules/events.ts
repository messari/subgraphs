import { decimal, integer } from "@protofire/subgraph-toolkit"
import { Deposit, Withdraw } from "../../generated/schema"
import { protocol } from "./protocol"
import { shared } from "./shared"

export namespace events {

	export namespace deposits {
		export function loadOrCreateDeposit(id: string): Deposit {
			let entity = Deposit.load(id)
			if (entity == null) {
				entity = new Deposit(id)
				entity.hash = ""
				entity.logIndex = 0
				entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
				entity.to = ""
				entity.from = ""
				entity.blockNumber = integer.ZERO
				entity.timestamp = integer.ZERO
				entity.asset = ""
				entity.amount = integer.ZERO
				entity.amountUSD = decimal.ZERO
				entity.vault = ""
			}
			return entity as Deposit
		}
	}

	export namespace withdraws {
		export function loadOrCreateWithdraw(id: string): Withdraw {
			let entity = Withdraw.load(id)
			if (entity == null) {
				entity = new Withdraw(id)
				entity.hash = ""
				entity.logIndex = 0
				entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
				entity.to = ""
				entity.from = ""
				entity.blockNumber = integer.ZERO
				entity.timestamp = integer.ZERO
				entity.asset = ""
				entity.amount = integer.ZERO
				entity.amountUSD = decimal.ZERO
				entity.vault = ""
			}
			return entity as Withdraw
		}
	}

}
