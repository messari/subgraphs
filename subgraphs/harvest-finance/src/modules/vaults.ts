import { Address } from "@graphprotocol/graph-ts";
import { decimal, integer } from "@protofire/subgraph-toolkit";
import { Vault } from "../../generated/schema"
import { protocol } from "./protocol";
import { shared } from "./shared";

export namespace vaults {
	export function loadOrCreateVault(vaultAddress: Address): Vault {
		let id = vaultAddress.toHexString()
		let entity = Vault.load(id)
		if (entity == null) {
			entity = new Vault(id)
			entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
			entity.inputToken = "";
			entity.outputToken = "";
			entity.rewardTokens = [];
			entity.totalValueLockedUSD = decimal.ZERO;
			entity.inputTokenBalance = integer.ZERO;
			entity.outputTokenSupply = integer.ZERO;
			entity.outputTokenPriceUSD = decimal.ZERO;
			entity.pricePerShare = decimal.ZERO;
			entity.rewardTokenEmissionsAmount = [];
			entity.rewardTokenEmissionsUSD = [];
			entity.createdTimestamp = integer.ZERO;
			entity.createdBlockNumber = integer.ZERO;
			entity.name = "";
			entity.symbol = "";
			entity.depositLimit = integer.ZERO;
			entity.fees = [];




		}
		return entity as Vault
	}
}