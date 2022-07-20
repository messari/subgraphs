import {
  Deposit as DepositEvent,
  EmergencyWithdraw as EmergencyWithdrawEvent,
  Harvest as HarvestEvent,
  LogPoolAddition as LogPoolAdditionEvent,
  LogSetPool as LogSetPoolEvent,
  LogSynapsePerSecond as LogSynapsePerSecondEvent,
  LogUpdatePool as LogUpdatePoolEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Withdraw as WithdrawEvent
} from "../generated/MiniChef/MiniChef"
import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogPoolAddition,
  LogSetPool,
  LogSynapsePerSecond,
  LogUpdatePool,
  OwnershipTransferred,
  Withdraw
} from "../generated/schema"

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.user = event.params.user
  entity.pid = event.params.pid
  entity.amount = event.params.amount
  entity.to = event.params.to
  entity.save()
}

export function handleEmergencyWithdraw(event: EmergencyWithdrawEvent): void {
  let entity = new EmergencyWithdraw(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.user = event.params.user
  entity.pid = event.params.pid
  entity.amount = event.params.amount
  entity.to = event.params.to
  entity.save()
}

export function handleHarvest(event: HarvestEvent): void {
  let entity = new Harvest(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.user = event.params.user
  entity.pid = event.params.pid
  entity.amount = event.params.amount
  entity.save()
}

export function handleLogPoolAddition(event: LogPoolAdditionEvent): void {
  let entity = new LogPoolAddition(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.pid = event.params.pid
  entity.allocPoint = event.params.allocPoint
  entity.lpToken = event.params.lpToken
  entity.rewarder = event.params.rewarder
  entity.save()
}

export function handleLogSetPool(event: LogSetPoolEvent): void {
  let entity = new LogSetPool(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.pid = event.params.pid
  entity.allocPoint = event.params.allocPoint
  entity.rewarder = event.params.rewarder
  entity.overwrite = event.params.overwrite
  entity.save()
}

export function handleLogSynapsePerSecond(
  event: LogSynapsePerSecondEvent
): void {
  let entity = new LogSynapsePerSecond(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.synapsePerSecond = event.params.synapsePerSecond
  entity.save()
}

export function handleLogUpdatePool(event: LogUpdatePoolEvent): void {
  let entity = new LogUpdatePool(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.pid = event.params.pid
  entity.lastRewardTime = event.params.lastRewardTime
  entity.lpSupply = event.params.lpSupply
  entity.accSynapsePerShare = event.params.accSynapsePerShare
  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.user = event.params.user
  entity.pid = event.params.pid
  entity.amount = event.params.amount
  entity.to = event.params.to
  entity.save()
}
