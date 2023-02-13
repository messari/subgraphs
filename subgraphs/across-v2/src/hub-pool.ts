import { BigInt } from "@graphprotocol/graph-ts"
import {
  HubPool,
  BondSet,
  CrossChainContractsSet,
  EmergencyRootBundleDeleted,
  IdentifierSet,
  L1TokenEnabledForLiquidityProvision,
  L2TokenDisabledForLiquidityProvision,
  LiquidityAdded,
  LiquidityRemoved,
  LivenessSet,
  OwnershipTransferred,
  Paused,
  ProposeRootBundle,
  ProtocolFeeCaptureSet,
  ProtocolFeesCapturedClaimed,
  RootBundleCanceled,
  RootBundleDisputed,
  RootBundleExecuted,
  SetEnableDepositRoute,
  SetPoolRebalanceRoute,
  SpokePoolAdminFunctionTriggered
} from "../generated/HubPool/HubPool"
import { ExampleEntity } from "../generated/schema"

export function handleBondSet(event: BondSet): void {
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
  entity.newBondToken = event.params.newBondToken
  entity.newBondAmount = event.params.newBondAmount

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
  // - contract.bondAmount(...)
  // - contract.bondToken(...)
  // - contract.crossChainContracts(...)
  // - contract.exchangeRateCurrent(...)
  // - contract.finder(...)
  // - contract.getCurrentTime(...)
  // - contract.identifier(...)
  // - contract.liquidityUtilizationCurrent(...)
  // - contract.liquidityUtilizationPostRelay(...)
  // - contract.liveness(...)
  // - contract.lpFeeRatePerSecond(...)
  // - contract.lpTokenFactory(...)
  // - contract.owner(...)
  // - contract.paused(...)
  // - contract.poolRebalanceRoute(...)
  // - contract.pooledTokens(...)
  // - contract.protocolFeeCaptureAddress(...)
  // - contract.protocolFeeCapturePct(...)
  // - contract.rootBundleProposal(...)
  // - contract.timerAddress(...)
  // - contract.unclaimedAccumulatedProtocolFees(...)
  // - contract.weth(...)
}

export function handleCrossChainContractsSet(
  event: CrossChainContractsSet
): void {}

export function handleEmergencyRootBundleDeleted(
  event: EmergencyRootBundleDeleted
): void {}

export function handleIdentifierSet(event: IdentifierSet): void {}

export function handleL1TokenEnabledForLiquidityProvision(
  event: L1TokenEnabledForLiquidityProvision
): void {}

export function handleL2TokenDisabledForLiquidityProvision(
  event: L2TokenDisabledForLiquidityProvision
): void {}

export function handleLiquidityAdded(event: LiquidityAdded): void {}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {}

export function handleLivenessSet(event: LivenessSet): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePaused(event: Paused): void {}

export function handleProposeRootBundle(event: ProposeRootBundle): void {}

export function handleProtocolFeeCaptureSet(
  event: ProtocolFeeCaptureSet
): void {}

export function handleProtocolFeesCapturedClaimed(
  event: ProtocolFeesCapturedClaimed
): void {}

export function handleRootBundleCanceled(event: RootBundleCanceled): void {}

export function handleRootBundleDisputed(event: RootBundleDisputed): void {}

export function handleRootBundleExecuted(event: RootBundleExecuted): void {}

export function handleSetEnableDepositRoute(
  event: SetEnableDepositRoute
): void {}

export function handleSetPoolRebalanceRoute(
  event: SetPoolRebalanceRoute
): void {}

export function handleSpokePoolAdminFunctionTriggered(
  event: SpokePoolAdminFunctionTriggered
): void {}
