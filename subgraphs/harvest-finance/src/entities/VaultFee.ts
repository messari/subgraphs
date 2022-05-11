import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { ControllerContract } from '../../generated/ControllerListener/ControllerContract';
import { VaultFee, Vault } from "../../generated/schema";
import * as constants from "../constant";


export function getOrCreateVaultFee(vault: Vault): VaultFee {
	let managementFee = constants.VaultFeeType.MANAGEMENT_FEE;


	// calls to get vaultFee information
	let vault_contract_address = Address.fromString(vault.id);
	let vault_contract = VaultContract.bind(vault_contract_address);
	let controller_contract_address: Address = vault_contract.try_controller().value;

	
	let controller_contract = ControllerContract.bind(controller_contract_address);
  	let profitSharingDenominator = controller_contract.try_profitSharingDenominator().value;
  	let profitSharingNumerator = controller_contract.try_profitSharingNumerator().value;
  	let feePercentage = profitSharingNumerator.toBigDecimal()
  		.div(profitSharingDenominator.toBigDecimal())
  		.times(constants.BIGINT_HUNDRED.toBigDecimal());



	let vaultFee_id = managementFee
		.concat("-")
		.concat(vault.id)
		.concat("-");

	let vaultFee = VaultFee.load(vaultFee_id);

	// Normaly vaultFee will not exist but if it's, we will update params
	if(!vaultFee){
		vaultFee = new VaultFee(vaultFee_id);
	}

  	// update / create vaultFee params
  	vaultFee.feeType = managementFee;
  	vaultFee.feePercentage = feePercentage;

  	vaultFee.save()

	return vaultFee as VaultFee;
}