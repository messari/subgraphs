import { BigInt } from "@graphprotocol/graph-ts"
import {
  Bridge,
  Paused,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TokenDeposit,
  TokenDepositAndSwap,
  TokenMint,
  TokenMintAndSwap,
  TokenRedeem,
  TokenRedeemAndRemove,
  TokenRedeemAndSwap,
  TokenRedeemV2,
  TokenWithdraw,
  TokenWithdrawAndRemove,
  Unpaused
} from "../generated/Bridge/Bridge"
import { ExampleEntity } from "../generated/schema"

export function handlePaused(event: Paused): void {
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
  entity.account = event.params.account

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
  // - contract.DEFAULT_ADMIN_ROLE(...)
  // - contract.GOVERNANCE_ROLE(...)
  // - contract.NODEGROUP_ROLE(...)
  // - contract.WETH_ADDRESS(...)
  // - contract.bridgeVersion(...)
  // - contract.chainGasAmount(...)
  // - contract.getFeeBalance(...)
  // - contract.getRoleAdmin(...)
  // - contract.getRoleMember(...)
  // - contract.getRoleMemberCount(...)
  // - contract.hasRole(...)
  // - contract.kappaExists(...)
  // - contract.paused(...)
  // - contract.startBlockNumber(...)
}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleTokenDeposit(event: TokenDeposit): void {}

export function handleTokenDepositAndSwap(event: TokenDepositAndSwap): void {}

export function handleTokenMint(event: TokenMint): void {}

export function handleTokenMintAndSwap(event: TokenMintAndSwap): void {}

export function handleTokenRedeem(event: TokenRedeem): void {}

export function handleTokenRedeemAndRemove(event: TokenRedeemAndRemove): void {}

export function handleTokenRedeemAndSwap(event: TokenRedeemAndSwap): void {}

export function handleTokenRedeemV2(event: TokenRedeemV2): void {}

export function handleTokenWithdraw(event: TokenWithdraw): void {}

export function handleTokenWithdrawAndRemove(
  event: TokenWithdrawAndRemove
): void {}

export function handleUnpaused(event: Unpaused): void {}
