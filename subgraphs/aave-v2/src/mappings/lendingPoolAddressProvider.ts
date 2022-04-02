import { Address, dataSource, DataSourceContext, log } from "@graphprotocol/graph-ts";

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

export const protocolAddress = "0x52D306e36E3B6B02c153d0266ff0f85d18BCD413";
export const priceOracleDefault = "0xa50ba011c48153de246e5192c8f9258a2ba79ca9";

export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
  const address = event.params.newAddress;
  // start indexing the address provider
  fetchProtocolEntity(protocolAddress);
  LendingPoolAddressesProviderTemplate.create(address);
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  const pool = event.params.id.toString();
  const address = event.params.newAddress;
  const context = initiateContext(event.address);
  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address, context);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, context);
  }
}

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  log.info('HANDLING PRICE ORACLE UPDATE TO ' + event.params.newAddress.toHexString(), [])
  const lendingProtocol = fetchProtocolEntity(protocolAddress);
  lendingProtocol.protocolPriceOracle = event.params.newAddress.toHexString();
  lendingProtocol.save();
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
  // Add Lending Pool address, price oracle contract address, and protocol id to the context for general accessibility
  const contract = AddressProviderContract.bind(addrProvider);
  log.info('AddrProvContract: ' + addrProvider.toHexString(), []);
  // Get the lending pool
  const trylendingPool = contract.try_getLendingPool();
  let lendingPool = ''
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString();
    log.info('initiateContext LP:' + lendingPool, []);
  }

  // Initialize the protocol entity
  const lendingProtocol = fetchProtocolEntity(protocolAddress);
  // Get the Address Provider Contract's Price Oracle
  const tryPriceOracle = contract.try_getPriceOracle();
  if (!tryPriceOracle.reverted) {
    lendingProtocol.protocolPriceOracle = tryPriceOracle.value.toHexString();
    log.info('initiateContext priceOracle: ' + lendingProtocol.protocolPriceOracle, []);
  } else {
    lendingProtocol.protocolPriceOracle = priceOracleDefault;
    log.error('FAILED TO GET ORACLE - REVERTED TO DEFAULT HARD-CODED AT ' + lendingProtocol.protocolPriceOracle, ['']);
  }
  lendingProtocol.save();

  log.info('CREATING CONTEXT ' + lendingPool + '-----' + lendingProtocol.id, []);
  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);
  context.setString("protocolId", lendingProtocol.id);
  return context;
}