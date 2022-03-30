import { BigInt } from "@graphprotocol/graph-ts"
import {
  Factory,
  BasePoolAdded,
  PlainPoolDeployed,
  MetaPoolDeployed
} from "../generated/Factory/Factory"
import { ExampleEntity } from "../generated/schema"

export function handleBasePoolAdded(event: BasePoolAdded): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.base_pool = event.params.base_pool

  // Entities can be written to the store with `.save()`
  entity.save()

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
  // - contract.metapool_implementations(...)
  // - contract.find_pool_for_coins(...)
  // - contract.find_pool_for_coins(...)
  // - contract.get_base_pool(...)
  // - contract.get_n_coins(...)
  // - contract.get_meta_n_coins(...)
  // - contract.get_coins(...)
  // - contract.get_underlying_coins(...)
  // - contract.get_decimals(...)
  // - contract.get_underlying_decimals(...)
  // - contract.get_metapool_rates(...)
  // - contract.get_balances(...)
  // - contract.get_underlying_balances(...)
  // - contract.get_A(...)
  // - contract.get_fees(...)
  // - contract.get_admin_balances(...)
  // - contract.get_coin_indices(...)
  // - contract.get_implementation_addresses(...)
  // - contract.is_meta(...)
  // - contract.get_pool_asset_type(...)
  // - contract.deploy_plain_pool(...)
  // - contract.deploy_plain_pool(...)
  // - contract.deploy_plain_pool(...)
  // - contract.deploy_metapool(...)
  // - contract.deploy_metapool(...)
  // - contract.convert_metapool_fees(...)
  // - contract.admin(...)
  // - contract.future_admin(...)
  // - contract.manager(...)
  // - contract.pool_list(...)
  // - contract.pool_count(...)
  // - contract.base_pool_list(...)
  // - contract.base_pool_count(...)
  // - contract.plain_implementations(...)
  // - contract.token_implementation(...)
  // - contract.fee_receiver(...)
  // - contract.get_pool_from_lp_token(...)
  // - contract.get_lp_token(...)
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {}
