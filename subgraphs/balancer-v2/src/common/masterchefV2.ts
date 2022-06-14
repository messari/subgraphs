import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogPoolAddition,
  LogSetPool,
  LogUpdatePool,
  UpdateEmissionRate,
  Withdraw,
} from '../../generated/MasterChefV2/MasterChefV2'

import {Address, log} from '@graphprotocol/graph-ts'
import {ACC_BEETX_PRECISION, BIG_INT_ONE, BIG_INT_ZERO} from 'const'

import {getMasterChef, getPool, getRewarder, getUser, updateRewarder} from '../entities'

export function logPoolAddition(event: LogPoolAddition): void {
  log.info('[MasterChefV2] Log Pool Addition {} {} {} {}', [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.lpToken.toHex(),
    event.params.rewarder.toHex()
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)
  const rewarder = getRewarder(event.params.rewarder, event.block)

  pool.pair = event.params.lpToken
  pool.rewarder = rewarder.id
  pool.allocPoint = event.params.allocPoint
  pool.save()

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(pool.allocPoint)
  masterChef.poolCount = masterChef.poolCount.plus(BIG_INT_ONE)
  masterChef.save()
}

export function logSetPool(event: LogSetPool): void {
  log.info('[MasterChefV2] Log Set Pool {} {} {} {}', [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.rewarder.toHex(),
    event.params.overwrite == true ? 'true' : 'false'
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)

  if (event.params.overwrite == true) {
     const rewarder = getRewarder(event.params.rewarder, event.block)
     pool.rewarder = rewarder.id
  }

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(event.params.allocPoint.minus(pool.allocPoint))
  masterChef.save()

  pool.allocPoint = event.params.allocPoint
  pool.save()
}

export function updateEmissionRate(event: UpdateEmissionRate): void {
  log.info('[MasterChef] Log update emission rate {} {}', [
    event.params.user.toString(),
    event.params._beetsPerSec.toString()
  ])

  const masterChef = getMasterChef(event.block)
  masterChef.beetsPerBlock = event.params._beetsPerSec
  masterChef.save()
}

export function logUpdatePool(event: LogUpdatePool): void {
  log.info('[MasterChefV2] Log Update Pool {} {} {} {}', [
    event.params.pid.toString(),
    event.params.lastRewardBlock.toString(),
    event.params.lpSupply.toString(),
    event.params.accBeetsPerShare.toString()
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)
  updateRewarder(Address.fromString(pool.rewarder))

  pool.accBeetsPerShare = event.params.accBeetsPerShare
  pool.lastRewardBlock = event.params.lastRewardBlock
  pool.save()
}

export function deposit(event: Deposit): void {
  log.info('[MasterChefV2] Log Deposit {} {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex()
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)
  const user = getUser(event.params.to, event.params.pid, event.block)

  pool.slpBalance = pool.slpBalance.plus(event.params.amount)
  if(user.amount === BIG_INT_ZERO && event.params.amount > BIG_INT_ZERO) {
    pool.userCount = pool.userCount.plus(BIG_INT_ONE)
  }
  pool.save()

  user.amount = user.amount.plus(event.params.amount)
  user.rewardDebt = user.rewardDebt.plus(event.params.amount.times(pool.accBeetsPerShare).div(ACC_BEETX_PRECISION))
  user.save()
}

export function withdraw(event: Withdraw): void {
  log.info('[MasterChefV2] Log Withdraw {} {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex()
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)
  const user = getUser(event.params.user, event.params.pid, event.block)

  user.amount = user.amount.minus(event.params.amount)
  user.rewardDebt = user.rewardDebt.minus(event.params.amount.times(pool.accBeetsPerShare).div(ACC_BEETX_PRECISION))
  user.save()

  pool.slpBalance = pool.slpBalance.minus(event.params.amount)
  if(user.amount === BIG_INT_ZERO) {
    pool.userCount = pool.userCount.minus(BIG_INT_ONE)
  }
  pool.save()

}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info('[MasterChefV2] Log Emergency Withdraw {} {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex()
  ])

  const masterChefV2 = getMasterChef(event.block)
  const user = getUser(event.params.user, event.params.pid, event.block)

  user.amount = BIG_INT_ZERO
  user.rewardDebt = BIG_INT_ZERO
  user.save()

  const pool = getPool(event.params.pid, event.block)
  pool.userCount = pool.userCount.minus(BIG_INT_ONE)
  pool.save()
}

export function harvest(event: Harvest): void {
  log.info('[MasterChefV2] Log Withdraw {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString()
  ])

  const masterChef = getMasterChef(event.block)
  const pool = getPool(event.params.pid, event.block)
  const user = getUser(event.params.user, event.params.pid, event.block)

  const accumulatedSushi = user.amount.times(pool.accBeetsPerShare).div(ACC_BEETX_PRECISION)

  user.rewardDebt = accumulatedSushi
  user.beetsHarvested = user.beetsHarvested.plus(event.params.amount)
  user.save()
}
