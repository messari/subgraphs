import { BigInt } from "@graphprotocol/graph-ts";
import { MainRegistry, PoolAdded, PoolRemoved } from "../generated/MainRegistry/MainRegistry";
import { ExampleEntity } from "../generated/schema";

export function handlePoolAdded(event: PoolAdded): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex());

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0);
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1);

  // Entity fields can be set based on event parameters
  entity.pool = event.params.pool;
  entity.rate_method_id = event.params.rate_method_id;

  // Entities can be written to the store with `.save()`
  entity.save();

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.find_pool_for_coins(...)
  // - contract.find_pool_for_coins(...)
  // - contract.get_n_coins(...)
  // - contract.get_coins(...)
  // - contract.get_underlying_coins(...)
  // - contract.get_decimals(...)
  // - contract.get_underlying_decimals(...)
  // - contract.get_rates(...)
  // - contract.get_gauges(...)
  // - contract.get_balances(...)
  // - contract.get_underlying_balances(...)
  // - contract.get_virtual_price_from_lp_token(...)
  // - contract.get_A(...)
  // - contract.get_parameters(...)
  // - contract.get_fees(...)
  // - contract.get_admin_balances(...)
  // - contract.get_coin_indices(...)
  // - contract.estimate_gas_used(...)
  // - contract.is_meta(...)
  // - contract.get_pool_name(...)
  // - contract.get_coin_swap_count(...)
  // - contract.get_coin_swap_complement(...)
  // - contract.get_pool_asset_type(...)
  // - contract.address_provider(...)
  // - contract.gauge_controller(...)
  // - contract.pool_list(...)
  // - contract.pool_count(...)
  // - contract.coin_count(...)
  // - contract.get_coin(...)
  // - contract.get_pool_from_lp_token(...)
  // - contract.get_lp_token(...)
  // - contract.last_updated(...)
}

export function handlePoolRemoved(event: PoolRemoved): void {}
