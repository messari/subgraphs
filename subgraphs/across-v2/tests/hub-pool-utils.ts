import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
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

export function createBondSetEvent(
  newBondToken: Address,
  newBondAmount: BigInt
): BondSet {
  let bondSetEvent = changetype<BondSet>(newMockEvent())

  bondSetEvent.parameters = new Array()

  bondSetEvent.parameters.push(
    new ethereum.EventParam(
      "newBondToken",
      ethereum.Value.fromAddress(newBondToken)
    )
  )
  bondSetEvent.parameters.push(
    new ethereum.EventParam(
      "newBondAmount",
      ethereum.Value.fromUnsignedBigInt(newBondAmount)
    )
  )

  return bondSetEvent
}

export function createCrossChainContractsSetEvent(
  l2ChainId: BigInt,
  adapter: Address,
  spokePool: Address
): CrossChainContractsSet {
  let crossChainContractsSetEvent = changetype<CrossChainContractsSet>(
    newMockEvent()
  )

  crossChainContractsSetEvent.parameters = new Array()

  crossChainContractsSetEvent.parameters.push(
    new ethereum.EventParam(
      "l2ChainId",
      ethereum.Value.fromUnsignedBigInt(l2ChainId)
    )
  )
  crossChainContractsSetEvent.parameters.push(
    new ethereum.EventParam("adapter", ethereum.Value.fromAddress(adapter))
  )
  crossChainContractsSetEvent.parameters.push(
    new ethereum.EventParam("spokePool", ethereum.Value.fromAddress(spokePool))
  )

  return crossChainContractsSetEvent
}

export function createEmergencyRootBundleDeletedEvent(
  poolRebalanceRoot: Bytes,
  relayerRefundRoot: Bytes,
  slowRelayRoot: Bytes,
  proposer: Address
): EmergencyRootBundleDeleted {
  let emergencyRootBundleDeletedEvent = changetype<EmergencyRootBundleDeleted>(
    newMockEvent()
  )

  emergencyRootBundleDeletedEvent.parameters = new Array()

  emergencyRootBundleDeletedEvent.parameters.push(
    new ethereum.EventParam(
      "poolRebalanceRoot",
      ethereum.Value.fromFixedBytes(poolRebalanceRoot)
    )
  )
  emergencyRootBundleDeletedEvent.parameters.push(
    new ethereum.EventParam(
      "relayerRefundRoot",
      ethereum.Value.fromFixedBytes(relayerRefundRoot)
    )
  )
  emergencyRootBundleDeletedEvent.parameters.push(
    new ethereum.EventParam(
      "slowRelayRoot",
      ethereum.Value.fromFixedBytes(slowRelayRoot)
    )
  )
  emergencyRootBundleDeletedEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer))
  )

  return emergencyRootBundleDeletedEvent
}

export function createIdentifierSetEvent(newIdentifier: Bytes): IdentifierSet {
  let identifierSetEvent = changetype<IdentifierSet>(newMockEvent())

  identifierSetEvent.parameters = new Array()

  identifierSetEvent.parameters.push(
    new ethereum.EventParam(
      "newIdentifier",
      ethereum.Value.fromFixedBytes(newIdentifier)
    )
  )

  return identifierSetEvent
}

export function createL1TokenEnabledForLiquidityProvisionEvent(
  l1Token: Address,
  lpToken: Address
): L1TokenEnabledForLiquidityProvision {
  let l1TokenEnabledForLiquidityProvisionEvent = changetype<
    L1TokenEnabledForLiquidityProvision
  >(newMockEvent())

  l1TokenEnabledForLiquidityProvisionEvent.parameters = new Array()

  l1TokenEnabledForLiquidityProvisionEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  l1TokenEnabledForLiquidityProvisionEvent.parameters.push(
    new ethereum.EventParam("lpToken", ethereum.Value.fromAddress(lpToken))
  )

  return l1TokenEnabledForLiquidityProvisionEvent
}

export function createL2TokenDisabledForLiquidityProvisionEvent(
  l1Token: Address,
  lpToken: Address
): L2TokenDisabledForLiquidityProvision {
  let l2TokenDisabledForLiquidityProvisionEvent = changetype<
    L2TokenDisabledForLiquidityProvision
  >(newMockEvent())

  l2TokenDisabledForLiquidityProvisionEvent.parameters = new Array()

  l2TokenDisabledForLiquidityProvisionEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  l2TokenDisabledForLiquidityProvisionEvent.parameters.push(
    new ethereum.EventParam("lpToken", ethereum.Value.fromAddress(lpToken))
  )

  return l2TokenDisabledForLiquidityProvisionEvent
}

export function createLiquidityAddedEvent(
  l1Token: Address,
  amount: BigInt,
  lpTokensMinted: BigInt,
  liquidityProvider: Address
): LiquidityAdded {
  let liquidityAddedEvent = changetype<LiquidityAdded>(newMockEvent())

  liquidityAddedEvent.parameters = new Array()

  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam(
      "lpTokensMinted",
      ethereum.Value.fromUnsignedBigInt(lpTokensMinted)
    )
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam(
      "liquidityProvider",
      ethereum.Value.fromAddress(liquidityProvider)
    )
  )

  return liquidityAddedEvent
}

export function createLiquidityRemovedEvent(
  l1Token: Address,
  amount: BigInt,
  lpTokensBurnt: BigInt,
  liquidityProvider: Address
): LiquidityRemoved {
  let liquidityRemovedEvent = changetype<LiquidityRemoved>(newMockEvent())

  liquidityRemovedEvent.parameters = new Array()

  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "lpTokensBurnt",
      ethereum.Value.fromUnsignedBigInt(lpTokensBurnt)
    )
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "liquidityProvider",
      ethereum.Value.fromAddress(liquidityProvider)
    )
  )

  return liquidityRemovedEvent
}

export function createLivenessSetEvent(newLiveness: BigInt): LivenessSet {
  let livenessSetEvent = changetype<LivenessSet>(newMockEvent())

  livenessSetEvent.parameters = new Array()

  livenessSetEvent.parameters.push(
    new ethereum.EventParam(
      "newLiveness",
      ethereum.Value.fromUnsignedBigInt(newLiveness)
    )
  )

  return livenessSetEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(isPaused: boolean): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("isPaused", ethereum.Value.fromBoolean(isPaused))
  )

  return pausedEvent
}

export function createProposeRootBundleEvent(
  challengePeriodEndTimestamp: BigInt,
  poolRebalanceLeafCount: i32,
  bundleEvaluationBlockNumbers: Array<BigInt>,
  poolRebalanceRoot: Bytes,
  relayerRefundRoot: Bytes,
  slowRelayRoot: Bytes,
  proposer: Address
): ProposeRootBundle {
  let proposeRootBundleEvent = changetype<ProposeRootBundle>(newMockEvent())

  proposeRootBundleEvent.parameters = new Array()

  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "challengePeriodEndTimestamp",
      ethereum.Value.fromUnsignedBigInt(challengePeriodEndTimestamp)
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "poolRebalanceLeafCount",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(poolRebalanceLeafCount))
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "bundleEvaluationBlockNumbers",
      ethereum.Value.fromUnsignedBigIntArray(bundleEvaluationBlockNumbers)
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "poolRebalanceRoot",
      ethereum.Value.fromFixedBytes(poolRebalanceRoot)
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "relayerRefundRoot",
      ethereum.Value.fromFixedBytes(relayerRefundRoot)
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam(
      "slowRelayRoot",
      ethereum.Value.fromFixedBytes(slowRelayRoot)
    )
  )
  proposeRootBundleEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer))
  )

  return proposeRootBundleEvent
}

export function createProtocolFeeCaptureSetEvent(
  newProtocolFeeCaptureAddress: Address,
  newProtocolFeeCapturePct: BigInt
): ProtocolFeeCaptureSet {
  let protocolFeeCaptureSetEvent = changetype<ProtocolFeeCaptureSet>(
    newMockEvent()
  )

  protocolFeeCaptureSetEvent.parameters = new Array()

  protocolFeeCaptureSetEvent.parameters.push(
    new ethereum.EventParam(
      "newProtocolFeeCaptureAddress",
      ethereum.Value.fromAddress(newProtocolFeeCaptureAddress)
    )
  )
  protocolFeeCaptureSetEvent.parameters.push(
    new ethereum.EventParam(
      "newProtocolFeeCapturePct",
      ethereum.Value.fromUnsignedBigInt(newProtocolFeeCapturePct)
    )
  )

  return protocolFeeCaptureSetEvent
}

export function createProtocolFeesCapturedClaimedEvent(
  l1Token: Address,
  accumulatedFees: BigInt
): ProtocolFeesCapturedClaimed {
  let protocolFeesCapturedClaimedEvent = changetype<
    ProtocolFeesCapturedClaimed
  >(newMockEvent())

  protocolFeesCapturedClaimedEvent.parameters = new Array()

  protocolFeesCapturedClaimedEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  protocolFeesCapturedClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "accumulatedFees",
      ethereum.Value.fromUnsignedBigInt(accumulatedFees)
    )
  )

  return protocolFeesCapturedClaimedEvent
}

export function createRootBundleCanceledEvent(
  disputer: Address,
  requestTime: BigInt
): RootBundleCanceled {
  let rootBundleCanceledEvent = changetype<RootBundleCanceled>(newMockEvent())

  rootBundleCanceledEvent.parameters = new Array()

  rootBundleCanceledEvent.parameters.push(
    new ethereum.EventParam("disputer", ethereum.Value.fromAddress(disputer))
  )
  rootBundleCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "requestTime",
      ethereum.Value.fromUnsignedBigInt(requestTime)
    )
  )

  return rootBundleCanceledEvent
}

export function createRootBundleDisputedEvent(
  disputer: Address,
  requestTime: BigInt
): RootBundleDisputed {
  let rootBundleDisputedEvent = changetype<RootBundleDisputed>(newMockEvent())

  rootBundleDisputedEvent.parameters = new Array()

  rootBundleDisputedEvent.parameters.push(
    new ethereum.EventParam("disputer", ethereum.Value.fromAddress(disputer))
  )
  rootBundleDisputedEvent.parameters.push(
    new ethereum.EventParam(
      "requestTime",
      ethereum.Value.fromUnsignedBigInt(requestTime)
    )
  )

  return rootBundleDisputedEvent
}

export function createRootBundleExecutedEvent(
  groupIndex: BigInt,
  leafId: BigInt,
  chainId: BigInt,
  l1Tokens: Array<Address>,
  bundleLpFees: Array<BigInt>,
  netSendAmounts: Array<BigInt>,
  runningBalances: Array<BigInt>,
  caller: Address
): RootBundleExecuted {
  let rootBundleExecutedEvent = changetype<RootBundleExecuted>(newMockEvent())

  rootBundleExecutedEvent.parameters = new Array()

  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "groupIndex",
      ethereum.Value.fromUnsignedBigInt(groupIndex)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam("leafId", ethereum.Value.fromUnsignedBigInt(leafId))
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "chainId",
      ethereum.Value.fromUnsignedBigInt(chainId)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "l1Tokens",
      ethereum.Value.fromAddressArray(l1Tokens)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "bundleLpFees",
      ethereum.Value.fromUnsignedBigIntArray(bundleLpFees)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "netSendAmounts",
      ethereum.Value.fromSignedBigIntArray(netSendAmounts)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "runningBalances",
      ethereum.Value.fromSignedBigIntArray(runningBalances)
    )
  )
  rootBundleExecutedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return rootBundleExecutedEvent
}

export function createSetEnableDepositRouteEvent(
  originChainId: BigInt,
  destinationChainId: BigInt,
  originToken: Address,
  depositsEnabled: boolean
): SetEnableDepositRoute {
  let setEnableDepositRouteEvent = changetype<SetEnableDepositRoute>(
    newMockEvent()
  )

  setEnableDepositRouteEvent.parameters = new Array()

  setEnableDepositRouteEvent.parameters.push(
    new ethereum.EventParam(
      "originChainId",
      ethereum.Value.fromUnsignedBigInt(originChainId)
    )
  )
  setEnableDepositRouteEvent.parameters.push(
    new ethereum.EventParam(
      "destinationChainId",
      ethereum.Value.fromUnsignedBigInt(destinationChainId)
    )
  )
  setEnableDepositRouteEvent.parameters.push(
    new ethereum.EventParam(
      "originToken",
      ethereum.Value.fromAddress(originToken)
    )
  )
  setEnableDepositRouteEvent.parameters.push(
    new ethereum.EventParam(
      "depositsEnabled",
      ethereum.Value.fromBoolean(depositsEnabled)
    )
  )

  return setEnableDepositRouteEvent
}

export function createSetPoolRebalanceRouteEvent(
  destinationChainId: BigInt,
  l1Token: Address,
  destinationToken: Address
): SetPoolRebalanceRoute {
  let setPoolRebalanceRouteEvent = changetype<SetPoolRebalanceRoute>(
    newMockEvent()
  )

  setPoolRebalanceRouteEvent.parameters = new Array()

  setPoolRebalanceRouteEvent.parameters.push(
    new ethereum.EventParam(
      "destinationChainId",
      ethereum.Value.fromUnsignedBigInt(destinationChainId)
    )
  )
  setPoolRebalanceRouteEvent.parameters.push(
    new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(l1Token))
  )
  setPoolRebalanceRouteEvent.parameters.push(
    new ethereum.EventParam(
      "destinationToken",
      ethereum.Value.fromAddress(destinationToken)
    )
  )

  return setPoolRebalanceRouteEvent
}

export function createSpokePoolAdminFunctionTriggeredEvent(
  chainId: BigInt,
  message: Bytes
): SpokePoolAdminFunctionTriggered {
  let spokePoolAdminFunctionTriggeredEvent = changetype<
    SpokePoolAdminFunctionTriggered
  >(newMockEvent())

  spokePoolAdminFunctionTriggeredEvent.parameters = new Array()

  spokePoolAdminFunctionTriggeredEvent.parameters.push(
    new ethereum.EventParam(
      "chainId",
      ethereum.Value.fromUnsignedBigInt(chainId)
    )
  )
  spokePoolAdminFunctionTriggeredEvent.parameters.push(
    new ethereum.EventParam("message", ethereum.Value.fromBytes(message))
  )

  return spokePoolAdminFunctionTriggeredEvent
}
