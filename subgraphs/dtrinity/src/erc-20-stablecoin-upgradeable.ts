import { BigInt } from "@graphprotocol/graph-ts"
import {
  ERC20StablecoinUpgradeable,
  AdminChanged,
  BeaconUpgraded,
  Upgraded,
  Approval,
  EIP712DomainChanged,
  Initialized,
  Paused,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  Transfer,
  Unpaused
} from "../generated/ERC20StablecoinUpgradeable/ERC20StablecoinUpgradeable"
import { ExampleEntity } from "../generated/schema"

export function handleAdminChanged(event: AdminChanged): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from)

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from)

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.previousAdmin = event.params.previousAdmin
  entity.newAdmin = event.params.newAdmin

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
  // - contract.admin(...)
  // - contract.implementation(...)
  // - contract.COMPLIANCE_ROLE(...)
  // - contract.DEFAULT_ADMIN_ROLE(...)
  // - contract.DOMAIN_SEPARATOR(...)
  // - contract.MINTER_ROLE(...)
  // - contract.PAUSER_ROLE(...)
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.decimals(...)
  // - contract.decreaseAllowance(...)
  // - contract.eip712Domain(...)
  // - contract.flashFee(...)
  // - contract.flashLoan(...)
  // - contract.getRoleAdmin(...)
  // - contract.hasRole(...)
  // - contract.increaseAllowance(...)
  // - contract.maxFlashLoan(...)
  // - contract.name(...)
  // - contract.nonces(...)
  // - contract.paused(...)
  // - contract.supportsInterface(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}

export function handleBeaconUpgraded(event: BeaconUpgraded): void {}

export function handleUpgraded(event: Upgraded): void {}

export function handleApproval(event: Approval): void {}

export function handleEIP712DomainChanged(event: EIP712DomainChanged): void {}

export function handleInitialized(event: Initialized): void {}

export function handlePaused(event: Paused): void {}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUnpaused(event: Unpaused): void {}
