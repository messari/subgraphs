import { Address, DataSourceContext, log } from "@graphprotocol/graph-ts";

import {
  ProxyCreated,
  LendingPoolUpdated,
  PriceOracleUpdated,
  LendingPoolConfiguratorUpdated,
  LendingPoolAddressesProvider as AddressProviderContract,
} from "../../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider";

import { AddressesProviderRegistered } from "../../generated/LendingPoolAddressesProviderRegistry/LendingPoolAddressesProviderRegistry"

import {
  LendingPool as LendingPoolTemplate,
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
  LendingPoolAddressesProvider as LendingPoolAddressesProviderTemplate
} from "../../generated/templates";
import { fetchProtocolEntity } from "./utilFunctions";

export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
  let address = event.params.newAddress;
  // start indexing the address provider
  LendingPoolAddressesProviderTemplate.create(address);
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  let pool = event.params.id.toString();
  let address = event.params.newAddress;
  log.info('pool:,' + pool + '- address: '+ address.toHexString()+ ' in handleProxyCreated', [pool, address.toHexString()])
  const context = initiateContext(event.address);

  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address, context);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, context);
  }
}

export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
  const context = initiateContext(event.address);
  startIndexingLendingPool(event.params.newAddress, context);
}


export function handleLendingPoolConfiguratorUpdated(event: LendingPoolConfiguratorUpdated): void {
  const context = initiateContext(event.address);
  startIndexingLendingPoolConfigurator(event.params.newAddress, context);
}

export function startIndexingLendingPool(poolAddress: Address, context: DataSourceContext): void {
  // Create a template for an implementation of a Lending Pool/Market
  // This indexes for events which users act upon a lending pool within the lendingPool.ts mapping script
  LendingPoolTemplate.createWithContext(poolAddress, context);
}

export function startIndexingLendingPoolConfigurator(configurator: Address, context: DataSourceContext): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}

function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool/Market address, price oracle contract address, and protocol id to the context for general accessibility
  // Need to verify that context is accessible from any file importing dataSource? or just scripts for templates directly called to createWithContext

  const contract = AddressProviderContract.bind(addrProvider);
  // NEED TO MOCK CONTRACT CALLS
  // https://thegraph.com/docs/en/developer/matchstick/#calling-a-mapping-function-with-an-event
  const trylendingPool = contract.try_getLendingPool();
  let lendingPool = ''
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString()
    log.info('init context LP:' + lendingPool, [lendingPool])
  } else {
    log.error('FAILED TO GET LENDING POOL', [''])
  }
  const lendingProtocol = fetchProtocolEntity('aave-v2');
  // Get the Address Provider Contract's Price Oracle
  const tryPriceOracle = contract.try_getPriceOracle();
  let priceOracle = ''
  if (!tryPriceOracle.reverted) {
    priceOracle = tryPriceOracle.value.toHexString()
    log.info('init context PO: ' + priceOracle, [priceOracle])
  } else {
    log.error('FAILED TO GET ORACLE', [''])
  }
  log.info('CREATING CONTEXT ' + lendingPool + '----' + priceOracle + '-----' + lendingProtocol.id , [lendingPool, priceOracle, addrProvider.toHexString()])
  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);
  context.setString("priceOracle", priceOracle);
  context.setString("protocolId", lendingProtocol.id);
  return context
}