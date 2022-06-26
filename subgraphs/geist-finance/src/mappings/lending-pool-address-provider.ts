import {
  Address,
  dataSource,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

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
  LendingPoolAddressesProvider as LendingPoolAddressesProviderTemplate,
} from "../../generated/templates";

import { getOrCreateLendingProtocol } from "../common/protocol";
import { setPriceOracleAddress } from "../common/price";

import { ZERO_ADDRESS } from "../common/utils/addresses";
import {
  AddressesProviderRegistered,
  LendingPoolAddressesProviderRegistry,
} from "../../generated/LendingPoolAddressesProviderRegistry/LendingPoolAddressesProviderRegistry";

import { PROTOCOL_ID_KEY } from "../common/utils/constants";

export function handleAddressesProviderRegistered(
  event: AddressesProviderRegistered
): void {
  const poolAddressesProviderRegistry = LendingPoolAddressesProviderRegistry.bind(
    event.address
  );
  if (poolAddressesProviderRegistry.getAddressesProvidersList().length > 1) {
    // TODO: add support for additional pools, when it becomes necessary
    log.error("Additional pool address providers not supported", []);
    return;
  }

  const context = new DataSourceContext();
  context.setString(PROTOCOL_ID_KEY, dataSource.address().toHexString());
  LendingPoolAddressesProviderTemplate.createWithContext(
    event.params.newAddress,
    context
  );
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  const pool = event.params.id.toString();
  const address = event.params.newAddress;
  const context = initiateContext(event.address);
  log.info("Proxy created at {}", [pool]);
  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address, context);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, context);
  }
}

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  setPriceOracleAddress(event.address, event.params.newAddress);
  // Also set for zero address as fallback for RewardsController which does not have poolAddressesProviderId in context
  setPriceOracleAddress(ZERO_ADDRESS, event.params.newAddress);
}

export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
  const context = initiateContext(event.address);
  startIndexingLendingPool(event.params.newAddress, context);
}

export function handleLendingPoolConfiguratorUpdated(
  event: LendingPoolConfiguratorUpdated
): void {
  const context = initiateContext(event.address);
  startIndexingLendingPoolConfigurator(event.params.newAddress, context);
}

export function startIndexingLendingPool(
  poolAddress: Address,
  context: DataSourceContext
): void {
  // Create a template for an implementation of a Lending Pool/Market
  // This indexes for events which users act upon a lending pool within the lendingPool.ts mapping script
  log.info("Started indexing lending pool with address={}", [
    poolAddress.toHexString(),
  ]);
  LendingPoolTemplate.createWithContext(poolAddress, context);
}

export function startIndexingLendingPoolConfigurator(
  configurator: Address,
  context: DataSourceContext
): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  log.info(
    "Started indexing lending pool config with configurator address={}",
    [configurator.toHexString()]
  );
  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}

function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool address, price oracle contract address, and protocol id to the context for general accessibility
  const contract = AddressProviderContract.bind(addrProvider);
  log.info("Address provider contract = {}", [addrProvider.toHexString()]);
  // Get the lending pool
  const trylendingPool = contract.try_getLendingPool();
  let lendingPool = "";
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString();
    log.info("Initiating lending pool={}", [lendingPool]);
  }

  // Initialize the protocol entity
  const lendingProtocol = getOrCreateLendingProtocol();
  log.info("Creating context with lending pool={} with ID={}", [
    lendingPool,
    lendingProtocol.id,
  ]);
  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);
  context.setString("protocolId", lendingProtocol.id);
  return context;
}
