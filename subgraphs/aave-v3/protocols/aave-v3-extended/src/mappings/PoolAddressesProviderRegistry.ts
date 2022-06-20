import { dataSource, DataSourceContext, log } from "@graphprotocol/graph-ts";
import {
  AddressesProviderRegistered,
  PoolAddressesProviderRegistry,
} from "../../../../generated/PoolAddressesProviderRegistry/PoolAddressesProviderRegistry";
import { PoolAddressesProvider } from "../../../../generated/templates";
import { PROTOCOL_ID_KEY } from "../../../../src/utils/constants";

export function handleAddressesProviderRegistered(
  event: AddressesProviderRegistered
): void {
  const poolAddressesProviderRegistry = PoolAddressesProviderRegistry.bind(
    event.address
  );
  if (poolAddressesProviderRegistry.getAddressesProvidersList().length > 1) {
    // TODO: add support for additional pools, when it becomes necessary
    log.error("Additional pool address providers not supported", []);
    return;
  }

  const context = new DataSourceContext();
  context.setString(PROTOCOL_ID_KEY, dataSource.address().toHexString());
  PoolAddressesProvider.createWithContext(
    event.params.addressesProvider,
    context
  );
}
