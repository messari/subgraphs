import { log, BigInt, Address } from '@graphprotocol/graph-ts'

// subgraph templates
//import { VaultListener } from '../../generated/templates'

// contract imports
import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog as SharePriceChangeLogEvent
} from "../../generated/ControllerListener/ControllerContract"
import { ERC20DetailedContract } from "../../generated/ControllerListener/ERC20DetailedContract"
import { VaultContract } from "../../generated/ControllerListener/VaultContract"

// schema imports


// helper entities functions imports
import { getOrCreateVault, updateVaultPrices } from './../entities/Vault'



export function handleSharePriceChangeLog(event: SharePriceChangeLogEvent): void{
  let vault_addr = event.params.vault;
  let block = event.block;
  let vault = getOrCreateVault(vault_addr, block);

  updateVaultPrices(event, vault);
}


export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vault_addr = call.inputs._vault
  let strategy_addr = call.inputs._strategy

  let block = call.block

  getOrCreateVault(vault_addr, block)
}