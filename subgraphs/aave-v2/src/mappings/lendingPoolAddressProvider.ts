import { Address, DataSourceContext } from "@graphprotocol/graph-ts";

import {
  ProxyCreated,
  LendingPoolUpdated,
  PriceOracleUpdated,
  LendingPoolConfiguratorUpdated,
  LendingPoolAddressesProvider as AddressProviderContract,
} from "../../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider";

import {
  LendingPool as LendingPoolTemplate,
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
} from "../../generated/templates";
import { fetchProtocolEntity } from "./utilFunctions";


export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  let pool = event.params.id.toString();
  let address = event.params.newAddress;
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

function startIndexingLendingPool(poolAddress: Address, context: DataSourceContext): void {
  // Create a template for an implementation of a Lending Pool/Market
  // This indexes for events which users act upon a lending pool within the lendingPool.ts mapping script
  LendingPoolTemplate.createWithContext(poolAddress, context);
}

function startIndexingLendingPoolConfigurator(configurator: Address, context: DataSourceContext): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}

function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool/Market address, price oracle contract address, and protocol id to the context for general accessibility
  // Need to verify that context is accessible from any file importing dataSource? or just scripts for templates directly called to createWithContext

  const contract = AddressProviderContract.bind(addrProvider);
  const lendingPool = contract.getLendingPool();
  const lendingProtocol = fetchProtocolEntity('aave-v2');
  // Get the Address Provider Contract's Price Oracle
  const priceOracle = contract.getPriceOracle();
  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool.toHexString());
  context.setString("priceOracle", priceOracle.toHexString());
  context.setString("protocolId", lendingProtocol.id);
  return context
}