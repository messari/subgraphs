import { Address, ByteArray } from "@graphprotocol/graph-ts";
import { ADDRESS_ZERO, decimal, integer } from "@protofire/subgraph-toolkit";
import { VaultContract } from "../../generated/ControllerListener/VaultContract";
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

	export function getValuesForVault(vaultAddress: Address): VaultValuesResult {
		let contract = VaultContract.bind(vaultAddress)
		let underlyingResult = contract.try_underlying()
		let value = !underlyingResult.reverted ? underlyingResult.value : Address.fromHexString(ADDRESS_ZERO) as Address


		return new VaultValuesResult(
			shared.readValue<string>(contract.try_symbol(), `fallBackValueFor ${vaultAddress.toHexString()}`),
			shared.readValue<string>(contract.try_name(), `fallBackValueFor ${vaultAddress.toHexString()}`),
			value
		)
	}

	export class VaultValuesResult {
		symbol: string;
		name: string;
		underLyingToken: Address;
		constructor(
			_symbol: string, _name: string, _underLyingToken: Address
		) {
			this.symbol = _symbol
			this.name = _name
			this.underLyingToken = _underLyingToken
		}
	}
}