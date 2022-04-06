// import { log } from '@graphprotocol/graph-ts'
import { BigInt, BigDecimal, Address, log, ethereum } from "@graphprotocol/graph-ts"
import { Pool } from "../../generated/Factory/Pool"
import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  Deposit,
  Withdraw,
  Swap,
  _Account,
  _DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  _LiquidityPoolAmount,
  LiquidityPoolFee
} from "../../generated/schema"
import { Pool as PoolTemplate } from '../../generated/templates'
import { Factory as FactoryContract } from '../../generated/templates/Pool/Factory'

import { BIGDECIMAL_ZERO, INT_ZERO, INT_ONE, FACTORY_ADDRESS, BIGDECIMAL_TWO, BIGINT_ZERO, LiquidityPoolFeeType, BIGDECIMAL_TEN_THOUSAND, PROTOCOL_FEE_TO_OFF, BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGDECIMAL_TEN, BIGINT_ONE } from "../common/constants"
import { getLiquidityPool, getLiquidityPoolAmounts, getLiquidityPoolFee, getOrCreateDex, getOrCreateEtherHelper, getOrCreateFinancials, getOrCreatePoolDailySnapshot, getOrCreateTokenTracker } from "./getters"
import { findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, WHITELIST_TOKENS } from "./pricing"
import { getOrCreateToken } from "./tokens"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ['0x9ea3b5b4ec044b70375236a281986106457b20ef']


// Create a liquidity pool from PairCreated contract call
export function CreateLiquidityPool(event: ethereum.Event, protocol: DexAmmProtocol, poolAddress: Address, fee: i64, token0: Token, token1: Token, LPtoken: Token): void {
  let poolAddressString = poolAddress.toHexString()
  let pool = new LiquidityPool(poolAddressString)

  // This entity stores the actual token amount after decimal adjustment
  let poolAmounts = new _LiquidityPoolAmount(poolAddressString)

  pool.protocol = protocol.id
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = LPtoken.id
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO
  pool.totalVolumeUSD = BIGDECIMAL_ZERO
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO]
  pool.outputTokenSupply = BIGINT_ZERO
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  pool.fees = createPoolFees(poolAddressString, fee)
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + LPtoken.symbol
  pool.symbol = LPtoken.symbol

  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]

  // Used to track the number of deposits into the liquidity pool
  let poolDeposits = new _HelperStore(poolAddressString)
  poolDeposits.valueInt = INT_ZERO
    
  // create the tracked contract based on the template
  PoolTemplate.create(poolAddress)

  poolDeposits.save()
  poolAmounts.save()
  pool.save()
}

function convertFeeToPercent(fee: i64): BigDecimal {
  return BigDecimal.fromString(fee.toString()).div(BIGDECIMAL_TEN_THOUSAND)
}

function createPoolFees(poolAddressString: string, fee: i64): string[] {
  // Trading Fee
  let poolTradingFee = new LiquidityPoolFee('trading-fee-'+poolAddressString)
  poolTradingFee.feeType = LiquidityPoolFeeType.TRADING_FEE
  poolTradingFee.feePercentage = convertFeeToPercent(fee)

  // Protocol Fee
  let poolProtocolFee = new LiquidityPoolFee('protocol-fee-'+poolAddressString)
  poolProtocolFee.feeType = LiquidityPoolFeeType.PROTOCOL_FEE
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_OFF

  poolTradingFee.save()
  poolProtocolFee.save()

  return [poolTradingFee.id, poolProtocolFee.id]
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations. 
export function UpdateTokenWhitelists(tokenTracker0: _TokenTracker, tokenTracker1: _TokenTracker, poolAddress: Address): void {
  // update white listed pools
  if (WHITELIST_TOKENS.includes(tokenTracker0.id)) {
    let newPools = tokenTracker1.whitelistPools
    newPools.push(poolAddress.toHexString())
    tokenTracker1.whitelistPools = newPools
    tokenTracker1.save()
  }

  if (WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    let newPools = tokenTracker0.whitelistPools
    newPools.push(poolAddress.toHexString())
    tokenTracker0.whitelistPools = newPools
    tokenTracker0.save()
  }
}

export function updatePrices(event: ethereum.Event): void {
  let pool = getLiquidityPool(event.address.toHexString())

  // Retrieve token Trackers
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // update ETH price now that prices could have changed
  let ether = getOrCreateEtherHelper()
  ether.valueDecimal = getEthPriceInUSD()

  // update token prices
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0 as _TokenTracker)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1 as _TokenTracker)
  
  tokenTracker0.save()
  tokenTracker1.save()
  ether.save()
}

// Update store that tracks the deposit count per pool
function incrementDepositHelper(poolAddress: string): void {
  let poolDeposits = _HelperStore.load(poolAddress)!
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE
  poolDeposits.save()
}

export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
  let ether = getOrCreateEtherHelper()

  let poolAddress = event.address.toHexString()

  let pool = getLiquidityPool(poolAddress)
  let poolAmounts = getLiquidityPoolAmounts(poolAddress)

  let protocol = getOrCreateDex()

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // Convert tokens according to decimals 
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals)
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals)

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(tokenTracker0.derivedETH.times(ether.valueDecimal!))
    .plus(amount1Converted.times(tokenTracker1.derivedETH.times(ether.valueDecimal!)))

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)

  // Update pool balances adjusted for decimals and not adjusted
  pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount0), pool.inputTokenBalances[1].plus(amount1)]
  poolAmounts.inputTokenBalances = [poolAmounts.inputTokenBalances[0].plus(amount0Converted), poolAmounts.inputTokenBalances[1].plus(amount1Converted)]
  
  // Get the total value locked in USD
  let totalValueLockedETH = poolAmounts.inputTokenBalances[0]
    .times(tokenTracker0.derivedETH)
    .plus(poolAmounts.inputTokenBalances[1].times(tokenTracker1.derivedETH))
  pool.totalValueLockedUSD = totalValueLockedETH.times(ether.valueDecimal!)

  // Increment for NFT minted representing the position
  pool.outputTokenSupply = pool.outputTokenSupply.plus(BIGINT_ONE)

  // Add pool value back to protocol total value locked 
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD)

  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  deposit.hash = event.transaction.hash.toHexString()
  deposit.logIndex = event.logIndex.toI32()
  deposit.protocol = protocol.id
  deposit.to = pool.id
  deposit.from = event.transaction.from.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  deposit.outputToken = pool.outputToken
  deposit.inputTokenAmounts = [amount0, amount1]
  deposit.outputTokenAmount = BIGINT_ONE
  deposit.pool = pool.id
  deposit.amountUSD = amountUSD

  incrementDepositHelper(poolAddress)

  deposit.save()
  pool.save()
  poolAmounts.save()
  protocol.save()
}

export function createWithdraw(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
  let ether = getOrCreateEtherHelper()

  let poolAddress = event.address.toHexString()

  let pool = getLiquidityPool(poolAddress)
  let poolAmounts = getLiquidityPoolAmounts(poolAddress)

  let protocol = getOrCreateDex()

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // Convert tokens according to decimals 
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals)
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals)

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(tokenTracker0.derivedETH.times(ether.valueDecimal!))
    .plus(amount1Converted.times(tokenTracker1.derivedETH.times(ether.valueDecimal!)))

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)

  // Update pool balances adjusted for decimals and not adjusted
  pool.inputTokenBalances = [pool.inputTokenBalances[0].minus(amount0), pool.inputTokenBalances[1].minus(amount1)]
  poolAmounts.inputTokenBalances = [poolAmounts.inputTokenBalances[0].minus(amount0Converted), poolAmounts.inputTokenBalances[1].minus(amount1Converted)]

  // Get the total value locked in USD
  let totalValueLockedETH = poolAmounts.inputTokenBalances[0]
    .times(tokenTracker0.derivedETH)
    .plus(poolAmounts.inputTokenBalances[1].times(tokenTracker1.derivedETH))
  pool.totalValueLockedUSD = totalValueLockedETH.times(ether.valueDecimal!)

  // Increment for NFT minted representing the position
  pool.outputTokenSupply = pool.outputTokenSupply.minus(BIGINT_ONE)

  // reset aggregates with new amounts
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD)

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  withdrawal.hash = event.transaction.hash.toHexString()
  withdrawal.logIndex = event.logIndex.toI32()
  withdrawal.protocol = protocol.id
  withdrawal.to = event.transaction.from.toHexString()
  withdrawal.from = pool.id
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  withdrawal.outputToken = pool.outputToken
  withdrawal.inputTokenAmounts = [amount0, amount1]
  withdrawal.outputTokenAmount = BIGINT_ONE
  withdrawal.pool = pool.id
  withdrawal.amountUSD = amountUSD

  withdrawal.save()
  pool.save()
  poolAmounts.save()
  protocol.save()
}

export function createSwapHandleVolumeAndFees(event: ethereum.Event, amount0: BigInt, amount1: BigInt, to: Address, from: Address): void {
  let poolAddress = event.address.toHexString()
  let ether = getOrCreateEtherHelper()
  let protocol = getOrCreateDex()
  let pool = getLiquidityPool(poolAddress)
  let poolAmounts = getLiquidityPoolAmounts(poolAddress)

  // hot fix for bad pricing
  if (pool.id == '0x9663f2ca0454accad3e094448ea6f77443880454') {
    return
  }

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // Convert tokens according to decimals 
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals)
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals)

  // need absolute amounts for volume
  let amount0Abs = amount0Converted
  if (amount0Converted.lt(BIGDECIMAL_ZERO)) {
    amount0Abs = amount0Converted.times(BigDecimal.fromString('-1'))
  }
  let amount1Abs = amount1Converted
  if (amount1Converted.lt(BIGDECIMAL_ZERO)) {
    amount1Abs = amount1Converted.times(BigDecimal.fromString('-1'))
  }

  let amount0USD = amount0Abs.times(tokenTracker0.derivedETH).times(ether.valueDecimal!)
  let amount1USD = amount1Abs.times(tokenTracker1.derivedETH).times(ether.valueDecimal!)

  // get amount that should be tracked only - div 2 because cant count both input and output as volume
  let trackedAmountUSD = getTrackedAmountUSD(amount0Abs, tokenTracker0 as _TokenTracker, amount1Abs, tokenTracker1 as _TokenTracker).div(
    BIGDECIMAL_TWO
  )

  // pool volume
  pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)

  // Update the pool with the new active liquidity, price, and tick.
  pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount0), pool.inputTokenBalances[1].plus(amount1)]
  poolAmounts.inputTokenBalances = [poolAmounts.inputTokenBalances[0].plus(amount0Converted), poolAmounts.inputTokenBalances[1].plus(amount1Converted)]

  // update USD pricing
  ether.valueDecimal = getEthPriceInUSD()
  ether.save()
  
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0 as _TokenTracker)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1 as _TokenTracker)

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)

  /**
   * Things afffected by new USD rates
   */
   // Get the total value locked in USD
  let totalValueLockedETH = poolAmounts.inputTokenBalances[0]
    .times(tokenTracker0.derivedETH)
    .plus(poolAmounts.inputTokenBalances[1].times(tokenTracker1.derivedETH))
  pool.totalValueLockedUSD = totalValueLockedETH.times(ether.valueDecimal!)

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD)

  // create Swap event
  let swap = new Swap(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  swap.hash = event.transaction.hash.toHexString()
  swap.logIndex = event.logIndex.toI32()
  swap.protocol = protocol.id
  swap.to = to.toHexString()
  swap.from = from.toHexString()
  swap.blockNumber = event.block.number
  swap.timestamp = event.block.timestamp
  swap.tokenIn = amount0 > BIGINT_ZERO ? token0.id : token1.id
  swap.amountIn = amount0 > BIGINT_ZERO ? amount0 : amount1
  swap.amountInUSD = amount0 > BIGINT_ZERO ? amount0USD : amount1USD
  swap.tokenOut = amount1 > BIGINT_ZERO ? token0.id : token1.id
  swap.amountOut = amount1 > BIGINT_ZERO ? amount0 : amount1
  swap.amountOutUSD = amount1 > BIGINT_ZERO ? amount0USD : amount1USD
  swap.pool = pool.id

  let FeesUSD = calculateFee(pool, trackedAmountUSD)
  updateVolumeAndFees(event, trackedAmountUSD, FeesUSD[0], FeesUSD[1])

  swap.save()
  pool.save()
  protocol.save()
  poolAmounts.save()
  tokenTracker0.save()
  tokenTracker1.save()
}

function percToDec(percentage: BigDecimal): BigDecimal {
  return percentage.div(BIGDECIMAL_HUNDRED)
}

function calculateFee(pool: LiquidityPool, trackedAmountUSD: BigDecimal): BigDecimal[] {
  let tradingFee = getLiquidityPoolFee(pool.fees[0])
  let protocolFee = getLiquidityPoolFee(pool.fees[1])
  let tradingFeeAmount = trackedAmountUSD.times(percToDec(tradingFee.feePercentage))
  let protocolFeeAmount = trackedAmountUSD.times(percToDec(protocolFee.feePercentage))
  
  return [tradingFeeAmount, protocolFeeAmount]
}

// Update the volume and accrued fees for all relavant entities 
export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, tradingFeeUSD: BigDecimal, protocolFeeUSD: BigDecimal): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let financialMetrics = getOrCreateFinancials(event);

  financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
  financialMetrics.feesUSD = financialMetrics.feesUSD.plus(tradingFeeUSD).plus(protocolFeeUSD)
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(tradingFeeUSD)
  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(protocolFeeUSD)

  poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
  pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)

  poolMetrics.save();
  financialMetrics.save()
  pool.save()
}

export function updateProtocolFees(event: ethereum.Event): void {
  let poolContract = Pool.bind(event.address)
  let pool = getLiquidityPool(event.address.toString())

  let tradingFee = getLiquidityPoolFee(pool.fees[0])
  let protocolFee = getLiquidityPoolFee(pool.fees[1])

  // Get the total proportion of swap value collected as a fee
  let totalPoolFee = tradingFee.feePercentage.plus(protocolFee.feePercentage)

  // Value5 is the feeProtocol variabe in the slot0 struct of the pool contract 
  let feeProtocol = poolContract.slot0().value5
  let protocolFeeProportion = BIGDECIMAL_ONE.div(BigDecimal.fromString(feeProtocol.toString()))

  // Update protocol and trading fees for this pool
  tradingFee.feePercentage = totalPoolFee.times(BIGDECIMAL_ONE.minus(protocolFeeProportion))
  protocolFee.feePercentage = totalPoolFee.times(protocolFeeProportion)

  tradingFee.save()
  protocolFee.save()
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
    let bd = BIGDECIMAL_ONE
    for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
      bd = bd.times(BIGDECIMAL_TEN)
    }
    return bd
}
  
export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: i32): BigDecimal {
    if (exchangeDecimals == INT_ZERO) {
      return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO
  } else {
    return amount0.div(amount1)
  }
}