import { BigInt } from "@graphprotocol/graph-ts";
import {
  BeefiVaultRegistryMATIC,
  OwnershipTransferred,
  VaultsRegistered,
  VaultsRetireStatusUpdated,
} from "../../generated/BeefiVaultRegistryMATIC/BeefiVaultRegistryMATIC";
import { ExampleEntity, Vault } from "../../generated/schema";
import { createVault } from "../helpers/create";

const maticChainId = "137";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
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
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

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
  // - contract.allVaultAddresses(...)
  // - contract.getStakedVaultsForAddress(...)
  // - contract.getVaultCount(...)
  // - contract.getVaultInfo(...)
  // - contract.getVaultsAfterBlock(...)
  // - contract.getVaultsForToken(...)
  // - contract.owner(...)
}

export function handleVaultsRegistered(event: VaultsRegistered): void {
  const vaults = event.params.vaults;

  for (let i = 0; i < vaults.length; i++) {
    let vault = Vault.load(maticChainId + vaults[i].toString());

    if (!vault) {
      vault = createVault(maticChainId + vaults[i].toString(), event.block);
      vault.save();
    }
  }
}

export function handleVaultsRetireStatusUpdated(
  event: VaultsRetireStatusUpdated
): void {}
