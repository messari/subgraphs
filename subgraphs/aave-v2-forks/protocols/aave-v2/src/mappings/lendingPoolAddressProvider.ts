import * as utils from "../common/utils";
import { ZERO_ADDRESS } from "../common/constants";
import { getOrCreateLendingProtocol } from "../common/initializers";
import { Address, DataSourceContext, log } from "@graphprotocol/graph-ts";
import {
  LendingPool as LendingPoolTemplate,
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
} from "../../../../generated/templates";
import {
  ProxyCreated,
  LendingPoolUpdated,
  PriceOracleUpdated,
  LendingPoolConfiguratorUpdated,
  LendingPoolAddressesProvider as AddressProviderContract,
} from "../../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";

// export function handleProxyCreated(event: ProxyCreated): void {
//   // Event handler for lending pool or configurator contract creation
//   const pool = event.params.id.toString();
//   const address = event.params.newAddress;
//   const context = initiateContext(event.address);

//   log.info("[ProxyCreated]: {}", [pool]);

//   if (pool == "LENDING_POOL") {
//     startIndexingLendingPool(address, context);
//   } else if (pool == "LENDING_POOL_CONFIGURATOR") {
//     startIndexingLendingPoolConfigurator(address, context);
//   }
// }

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  log.info("[PriceOracleUpdated] OracleAddress: {}", [event.params.newAddress.toHexString()]);
  const lendingProtocol = getOrCreateLendingProtocol();
  lendingProtocol._protocolPriceOracle = event.params.newAddress.toHexString();
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
  log.info("START INDEXING LENDING POOL", []);
  LendingPoolTemplate.createWithContext(poolAddress, context);
}

export function startIndexingLendingPoolConfigurator(configurator: Address, context: DataSourceContext): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  log.info("START INDEXING LENDING POOL CONFIG", []);
  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}

function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool address, price oracle contract address,
  // and protocol id to the context for general accessibility
  const contract = AddressProviderContract.bind(addrProvider);
  log.info("AddrProvContract: " + addrProvider.toHexString(), []);
  // Get the lending pool
  const trylendingPool = contract.try_getLendingPool();
  let lendingPool = "";
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString();
    log.info("initiateContext LP:" + lendingPool, []);
  }

  // Initialize the protocol entity
  const lendingProtocol = getOrCreateLendingProtocol();

  const priceOracle = utils.readValue<Address>(
    contract.try_getPriceOracle(),
    Address.fromString(ZERO_ADDRESS),
  );

  lendingProtocol._protocolPriceOracle = priceOracle.toHexString();
  lendingProtocol.save();

  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);

  return context;
}
