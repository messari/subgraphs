import { 
    BigInt, 
    BigDecimal, 
    Address, 
    log 
  } from "@graphprotocol/graph-ts"

import { 
    ProxyCreated,
    PriceOracleUpdated,
    LendingPoolUpdated,
    LendingPoolConfiguratorUpdated,
  } from "../../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider"
  
import { 
    AddressesProviderRegistered,
    AddressesProviderUnregistered
} from "../../generated/LendingPoolAddressesProviderRegistry/LendingPoolAddressesProviderRegistry"

import {
    LendingPool as LendingPoolTemplate,
    LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
    LendingPoolAddressesProvider as LendingPoolAddressesProviderTemplate
} from '../../generated/templates'


export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
    let address = event.params.newAddress.toHexString();
    LendingPoolAddressesProviderTemplate.create(Address.fromString(address));
}

export function handleAddressesProviderUnregistered(event: AddressesProviderUnregistered): void {
  let address = event.params.newAddress.toHexString();
  LendingPoolAddressesProviderTemplate.create(Address.fromString(address));
}

export function handleProxyCreated(event: ProxyCreated): void {
    log.warning('Proxy created', [])
  
    let newProxyAddress = event.params.newAddress
    let contactId = event.params.id.toString()
  
    if (contactId == 'LENDING_POOL') {
        LendingPoolTemplate.create(newProxyAddress)
    } else if (contactId == 'LENDING_POOL_CONFIGURATOR') {
        LendingPoolConfiguratorTemplate.create(newProxyAddress)
    }
  }

  export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
    LendingPoolTemplate.create(event.params.newAddress);
  }

  export function handleLendingPoolConfiguratorUpdated(event: LendingPoolConfiguratorUpdated): void {
    LendingPoolConfiguratorTemplate.create(event.params.newAddress);
  }

  export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
    
  }