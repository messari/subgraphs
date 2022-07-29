import { Address, dataSource } from "@graphprotocol/graph-ts";
import { Pool, PoolConfigurator } from "../../../../generated/templates";
import {
  PriceOracleUpdated,
  ProxyCreated,
} from "../../../../generated/templates/PoolAddressesProvider/PoolAddressesProvider";
import { setPriceOracleAddress } from "../entities/price";
import {
  POOL_ADDRESSES_PROVIDER_ID_KEY,
  ZERO_ADDRESS,
} from "../../../../src/utils/constants";

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  setPriceOracleAddress(event.address, event.params.newAddress);
  // Also set for zero address as fallback for RewardsController which does not have poolAddressesProviderId in context
  setPriceOracleAddress(
    Address.fromString(ZERO_ADDRESS),
    event.params.newAddress
  );
}

export function handleProxyCreated(event: ProxyCreated): void {
  const context = dataSource.context();
  context.setString(
    POOL_ADDRESSES_PROVIDER_ID_KEY,
    event.address.toHexString()
  );
  const id = event.params.id.toString();
  if ("POOL" == id) {
    Pool.createWithContext(event.params.proxyAddress, context);
  } else if ("POOL_CONFIGURATOR" == id) {
    PoolConfigurator.createWithContext(event.params.proxyAddress, context);
  }
}
