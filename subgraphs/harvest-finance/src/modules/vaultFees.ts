import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ControllerContract } from "../../generated/ControllerListener/ControllerContract"
import { VaultFee } from "../../generated/schema"
import { shared } from "./shared"

export namespace vaultFees {
	export function loadOrCreateVaultFee(vaultId: string): VaultFee {
		let id = `${shared.constants.VaultFeeType.MANAGEMENT_FEE}-${vaultId}`
		let entity = VaultFee.load(id)
		if (entity == null) {
			entity = new VaultFee(id)
			entity.feeType = shared.constants.VaultFeeType.MANAGEMENT_FEE
			// It's now useless to setup defuault values for entites because of how codegen works
		}
		return entity as VaultFee
	}

	export function getValuesForVaultFee(controllerAddress: Address): VaultFeeVaulesResult {
		let contract = ControllerContract.bind(controllerAddress)
		let profitSharingDenominator = contract.try_profitSharingDenominator().value;
		let profitSharingNumerator = contract.try_profitSharingNumerator().value;
		return new VaultFeeVaulesResult(profitSharingDenominator, profitSharingNumerator)

	}

	export class VaultFeeVaulesResult {
		profitSharingDenominator: BigInt
		profitSharingNumerator: BigInt
		constructor(
			_profitSharingDenominator: BigInt,
			_profitSharingNumerator: BigInt

		) {
			this.profitSharingDenominator = _profitSharingDenominator
			this.profitSharingNumerator = _profitSharingNumerator
		}
	}

}