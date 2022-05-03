import { log, BigInt, Address } from '@graphprotocol/graph-ts'

// subgraph templates
//import { VaultListener } from '../generated/templates'

// contract imports
import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog as SharePriceChangeLogEvent
} from "../generated/ControllerListener/ControllerContract"
import { ERC20DetailedContract } from "../generated/ControllerListener/ERC20DetailedContract"
import { VaultContract } from "../generated/ControllerListener/VaultContract"

// schema imports


// helper function imports
import { getOrCreateVault } from './entities/Vault'

/*
export function handleSharePriceChangeLog(event: SharePriceChangeLogEvent): void{
  let transaction_hash = event.transaction.hash.toHex()

  let share_price_change_log = new SharePriceChangeLog(transaction_hash)
  share_price_change_log.doHardWork = transaction_hash
  share_price_change_log.oldSharePrice = event.params.oldSharePrice
  share_price_change_log.newSharePrice = event.params.newSharePrice

  share_price_change_log.save()
}
*/


export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vault_addr = call.inputs._vault
  let strategy_addr = call.inputs._strategy

  let block = call.block

  getOrCreateVault(vault_addr, block)
}