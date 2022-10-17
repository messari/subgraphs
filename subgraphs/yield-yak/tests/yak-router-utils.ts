import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  Recovered,
  UpdatedAdapters,
  UpdatedFeeClaimer,
  UpdatedMinFee,
  UpdatedTrustedTokens,
  YakSwap
} from "../generated/YakRouter/YakRouter"

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

export function createRecoveredEvent(
  _asset: Address,
  amount: BigInt
): Recovered {
  let recoveredEvent = changetype<Recovered>(newMockEvent())

  recoveredEvent.parameters = new Array()

  recoveredEvent.parameters.push(
    new ethereum.EventParam("_asset", ethereum.Value.fromAddress(_asset))
  )
  recoveredEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return recoveredEvent
}

export function createUpdatedAdaptersEvent(
  _newAdapters: Array<Address>
): UpdatedAdapters {
  let updatedAdaptersEvent = changetype<UpdatedAdapters>(newMockEvent())

  updatedAdaptersEvent.parameters = new Array()

  updatedAdaptersEvent.parameters.push(
    new ethereum.EventParam(
      "_newAdapters",
      ethereum.Value.fromAddressArray(_newAdapters)
    )
  )

  return updatedAdaptersEvent
}

export function createUpdatedFeeClaimerEvent(
  _oldFeeClaimer: Address,
  _newFeeClaimer: Address
): UpdatedFeeClaimer {
  let updatedFeeClaimerEvent = changetype<UpdatedFeeClaimer>(newMockEvent())

  updatedFeeClaimerEvent.parameters = new Array()

  updatedFeeClaimerEvent.parameters.push(
    new ethereum.EventParam(
      "_oldFeeClaimer",
      ethereum.Value.fromAddress(_oldFeeClaimer)
    )
  )
  updatedFeeClaimerEvent.parameters.push(
    new ethereum.EventParam(
      "_newFeeClaimer",
      ethereum.Value.fromAddress(_newFeeClaimer)
    )
  )

  return updatedFeeClaimerEvent
}

export function createUpdatedMinFeeEvent(
  _oldMinFee: BigInt,
  _newMinFee: BigInt
): UpdatedMinFee {
  let updatedMinFeeEvent = changetype<UpdatedMinFee>(newMockEvent())

  updatedMinFeeEvent.parameters = new Array()

  updatedMinFeeEvent.parameters.push(
    new ethereum.EventParam(
      "_oldMinFee",
      ethereum.Value.fromUnsignedBigInt(_oldMinFee)
    )
  )
  updatedMinFeeEvent.parameters.push(
    new ethereum.EventParam(
      "_newMinFee",
      ethereum.Value.fromUnsignedBigInt(_newMinFee)
    )
  )

  return updatedMinFeeEvent
}

export function createUpdatedTrustedTokensEvent(
  _newTrustedTokens: Array<Address>
): UpdatedTrustedTokens {
  let updatedTrustedTokensEvent = changetype<UpdatedTrustedTokens>(
    newMockEvent()
  )

  updatedTrustedTokensEvent.parameters = new Array()

  updatedTrustedTokensEvent.parameters.push(
    new ethereum.EventParam(
      "_newTrustedTokens",
      ethereum.Value.fromAddressArray(_newTrustedTokens)
    )
  )

  return updatedTrustedTokensEvent
}

export function createYakSwapEvent(
  _tokenIn: Address,
  _tokenOut: Address,
  _amountIn: BigInt,
  _amountOut: BigInt
): YakSwap {
  let yakSwapEvent = changetype<YakSwap>(newMockEvent())

  yakSwapEvent.parameters = new Array()

  yakSwapEvent.parameters.push(
    new ethereum.EventParam("_tokenIn", ethereum.Value.fromAddress(_tokenIn))
  )
  yakSwapEvent.parameters.push(
    new ethereum.EventParam("_tokenOut", ethereum.Value.fromAddress(_tokenOut))
  )
  yakSwapEvent.parameters.push(
    new ethereum.EventParam(
      "_amountIn",
      ethereum.Value.fromUnsignedBigInt(_amountIn)
    )
  )
  yakSwapEvent.parameters.push(
    new ethereum.EventParam(
      "_amountOut",
      ethereum.Value.fromUnsignedBigInt(_amountOut)
    )
  )

  return yakSwapEvent
}
