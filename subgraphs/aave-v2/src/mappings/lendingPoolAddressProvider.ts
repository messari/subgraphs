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


export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  let pool = event.params.id.toString();
  let address = event.params.newAddress;

  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, event.address);
  }
}

export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
  startIndexingLendingPool(event.params.newAddress);
}


export function handleLendingPoolConfiguratorUpdated(event: LendingPoolConfiguratorUpdated): void {
  startIndexingLendingPoolConfigurator(event.params.newAddress, event.address);
}


export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  // Needed? Oracle management will need to be implemented for market/token USD values. Still yet to start on that facet of event management for this subgraph
}

function startIndexingLendingPool(poolAddress: Address): void {
  // Create a template for an implementation of a Lending Pool/Market
  // This indexes for events which users act upon a lending pool within the lendingPool.ts mapping script
  LendingPoolTemplate.create(poolAddress);
}

function startIndexingLendingPoolConfigurator(configurator: Address, addrProvider: Address): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  // The Lending Pool/Market address is added to the context for general accessibility
  // Need to verify that conext is accesible from any file importing dataSource? or just lendingPoolConfigurator.ts?
  const contract = AddressProviderContract.bind(addrProvider);
  const lendingPool = contract.getLendingPool();
  // Get the Address Provider Contract's Price Oracle
  const priceOracle = contract.getPriceOracle();
  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool.toHexString());
  context.setString("priceOracle", priceOracle.toHexString());

  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}