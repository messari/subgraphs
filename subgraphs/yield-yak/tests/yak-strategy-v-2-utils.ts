import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  AllowDepositor,
  Approval,
  Deposit,
  DepositsEnabled,
  OwnershipTransferred,
  Recovered,
  Reinvest,
  RemoveDepositor,
  Transfer,
  UpdateAdminFee,
  UpdateDevAddr,
  UpdateDevFee,
  UpdateMaxTokensToDepositWithoutReinvest,
  UpdateMinTokensToReinvest,
  UpdateReinvestReward,
  Withdraw
} from "../generated/YakStrategyV2/YakStrategyV2"

export function createAllowDepositorEvent(account: Address): AllowDepositor {
  let allowDepositorEvent = changetype<AllowDepositor>(newMockEvent())

  allowDepositorEvent.parameters = new Array()

  allowDepositorEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return allowDepositorEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createDepositEvent(account: Address, amount: BigInt): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return depositEvent
}

export function createDepositsEnabledEvent(newValue: boolean): DepositsEnabled {
  let depositsEnabledEvent = changetype<DepositsEnabled>(newMockEvent())

  depositsEnabledEvent.parameters = new Array()

  depositsEnabledEvent.parameters.push(
    new ethereum.EventParam("newValue", ethereum.Value.fromBoolean(newValue))
  )

  return depositsEnabledEvent
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

export function createRecoveredEvent(
  token: Address,
  amount: BigInt
): Recovered {
  let recoveredEvent = changetype<Recovered>(newMockEvent())

  recoveredEvent.parameters = new Array()

  recoveredEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  recoveredEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return recoveredEvent
}

export function createReinvestEvent(
  newTotalDeposits: BigInt,
  newTotalSupply: BigInt
): Reinvest {
  let reinvestEvent = changetype<Reinvest>(newMockEvent())

  reinvestEvent.parameters = new Array()

  reinvestEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalDeposits",
      ethereum.Value.fromUnsignedBigInt(newTotalDeposits)
    )
  )
  reinvestEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalSupply",
      ethereum.Value.fromUnsignedBigInt(newTotalSupply)
    )
  )

  return reinvestEvent
}

export function createRemoveDepositorEvent(account: Address): RemoveDepositor {
  let removeDepositorEvent = changetype<RemoveDepositor>(newMockEvent())

  removeDepositorEvent.parameters = new Array()

  removeDepositorEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return removeDepositorEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createUpdateAdminFeeEvent(
  oldValue: BigInt,
  newValue: BigInt
): UpdateAdminFee {
  let updateAdminFeeEvent = changetype<UpdateAdminFee>(newMockEvent())

  updateAdminFeeEvent.parameters = new Array()

  updateAdminFeeEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  updateAdminFeeEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return updateAdminFeeEvent
}

export function createUpdateDevAddrEvent(
  oldValue: Address,
  newValue: Address
): UpdateDevAddr {
  let updateDevAddrEvent = changetype<UpdateDevAddr>(newMockEvent())

  updateDevAddrEvent.parameters = new Array()

  updateDevAddrEvent.parameters.push(
    new ethereum.EventParam("oldValue", ethereum.Value.fromAddress(oldValue))
  )
  updateDevAddrEvent.parameters.push(
    new ethereum.EventParam("newValue", ethereum.Value.fromAddress(newValue))
  )

  return updateDevAddrEvent
}

export function createUpdateDevFeeEvent(
  oldValue: BigInt,
  newValue: BigInt
): UpdateDevFee {
  let updateDevFeeEvent = changetype<UpdateDevFee>(newMockEvent())

  updateDevFeeEvent.parameters = new Array()

  updateDevFeeEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  updateDevFeeEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return updateDevFeeEvent
}

export function createUpdateMaxTokensToDepositWithoutReinvestEvent(
  oldValue: BigInt,
  newValue: BigInt
): UpdateMaxTokensToDepositWithoutReinvest {
  let updateMaxTokensToDepositWithoutReinvestEvent = changetype<
    UpdateMaxTokensToDepositWithoutReinvest
  >(newMockEvent())

  updateMaxTokensToDepositWithoutReinvestEvent.parameters = new Array()

  updateMaxTokensToDepositWithoutReinvestEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  updateMaxTokensToDepositWithoutReinvestEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return updateMaxTokensToDepositWithoutReinvestEvent
}

export function createUpdateMinTokensToReinvestEvent(
  oldValue: BigInt,
  newValue: BigInt
): UpdateMinTokensToReinvest {
  let updateMinTokensToReinvestEvent = changetype<UpdateMinTokensToReinvest>(
    newMockEvent()
  )

  updateMinTokensToReinvestEvent.parameters = new Array()

  updateMinTokensToReinvestEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  updateMinTokensToReinvestEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return updateMinTokensToReinvestEvent
}

export function createUpdateReinvestRewardEvent(
  oldValue: BigInt,
  newValue: BigInt
): UpdateReinvestReward {
  let updateReinvestRewardEvent = changetype<UpdateReinvestReward>(
    newMockEvent()
  )

  updateReinvestRewardEvent.parameters = new Array()

  updateReinvestRewardEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  updateReinvestRewardEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return updateReinvestRewardEvent
}

export function createWithdrawEvent(
  account: Address,
  amount: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = new Array()

  withdrawEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return withdrawEvent
}
