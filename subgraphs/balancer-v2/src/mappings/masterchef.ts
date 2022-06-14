import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogPoolAddition,
  LogSetPool,
  LogUpdatePool,
  MasterChefV2,
  UpdateEmissionRate,
  Withdraw,
} from '../../generated/MasterChefV2/MasterChefV2'

import {Address, bigInt, BigInt, log} from '@graphprotocol/graph-ts'
import { getLiquidityPool, getOrCreateDex } from '../common/getters'
import { BEETS, MASTERCHEFV2_ADDRESS, SECONDS_PER_DAY } from '../common/constants';
import { getUsdPricePerToken } from '../prices';
import { DEFAULT_DECIMALS } from '../prices/common/constants';
import { convertTokenToDecimal } from '../common/utils/utils';


export function handleUpdateEmissionRate(event: UpdateEmissionRate): void {
  log.info('[MasterChef] Log update emission rate {} {}', [
    event.params.user.toString(),
    event.params._beetsPerSec.toString()
  ])
  let protocol = getOrCreateDex();
  protocol.beetsPerBlock =  event.params._beetsPerSec;
  protocol.save()
}

export function  handleLogSetPool(event: LogSetPool): void {
  log.info('[MasterChefV2] Log Set Pool {} {} {} {}', [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.rewarder.toHex(),
    event.params.overwrite == true ? 'true' : 'false'
  ])
  //get the contract address
  let masterChef =  MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if(poolAddress.reverted) {return}
  let pool =  getLiquidityPool(poolAddress.value.toHexString());

  let protocol = getOrCreateDex();
  protocol.totalAllocPoint =  protocol.totalAllocPoint.plus(event.params.allocPoint.minus(pool.allocPoint))
  protocol.save()
  pool.allocPoint = event.params.allocPoint;
  let tokenAmount = pool.allocPoint.div(protocol.totalAllocPoint)
  .times(protocol.beetsPerBlock).times(BigInt.fromI32(SECONDS_PER_DAY));
  pool.rewardTokenEmissionsAmount![0] =  BigInt.fromString(convertTokenToDecimal(tokenAmount,DEFAULT_DECIMALS.toI32()).toString()); 
  pool.rewardTokenEmissionsUSD![0] =  getUsdPricePerToken(BEETS).usdPrice.times(pool.rewardTokenEmissionsAmount![0] .toBigDecimal());
  pool.save()
}

export function handleLogUpdatePool(event: LogUpdatePool): void {
  log.info('[MasterChefV2] Log Update Pool {} {} {} {}', [
    event.params.pid.toString(),
    event.params.lastRewardBlock.toString(),
    event.params.lpSupply.toString(),
    event.params.accBeetsPerShare.toString()
  ])

  //get the contract address
  let masterChef =  MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if(poolAddress.reverted) {return}
  let pool =  getLiquidityPool(poolAddress.value.toHexString());
  pool.outputTokenSupply  = event.params.lpSupply;
  pool.save()
}

export function handleDeposit(event: Deposit): void {
  log.info('[MasterChefV2] Log Deposit {} {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex()
  ])

  //get the contract address
  let masterChef =  MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if(poolAddress.reverted) {return}
  let pool =  getLiquidityPool(poolAddress.value.toHexString());
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(event.params.amount);
  pool.save()
}

export function handleWithdraw(event: Withdraw): void {
  log.info('[MasterChefV2] Log Withdraw {} {} {} {}', [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex()
  ])

  //get the contract address
  let masterChef =  MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if(poolAddress.reverted) {return}
  let pool =  getLiquidityPool(poolAddress.value.toHexString());
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(event.params.amount);
  pool.save()
}