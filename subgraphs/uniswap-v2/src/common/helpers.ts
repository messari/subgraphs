import { BigInt, BigDecimal, Address, store, log, ethereum } from "@graphprotocol/graph-ts"

import {
  _Account,
  _DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  _Burn as BurnEvent,
  Token,
  DexAmmProtocol,
  LiquidityPool,
  Deposit,
  Withdraw,
  Swap as SwapEvent
} from "../../generated/schema"
import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'
import { Pair as PairTemplate } from '../../generated/templates'
import { BIGDECIMAL_ZERO, INT_ZERO, INT_ONE, FACTORY_ADDRESS, SWAP_FEE } from "../common/constants"
import { findEthPerToken, getEthPriceInUSD, getTrackedVolumeUSD, WHITELIST } from "./Price"
import { getLiquidityPool, createBurn, createMint, getMint, getBurn, getOrCreateDex, getOrCreateEtherHelper, getOrCreateToken, getOrCreateTokenTracker, getOrCreateTransaction } from "./getters"
import { updateVolumeAndFees } from "./intervalUpdates"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ['0x9ea3b5b4ec044b70375236a281986106457b20ef']

export function CreateLiquidityPool(event: ethereum.Event, protocol: DexAmmProtocol, poolAddress: Address, token0: Token, token1: Token, LPtoken: Token): void {
  let pool = new LiquidityPool(poolAddress.toHexString())

  pool.protocol = protocol.id
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = LPtoken.id
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO
  pool.totalVolumeUSD = BIGDECIMAL_ZERO
  pool.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  pool.outputTokenSupply = BIGDECIMAL_ZERO
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + LPtoken.symbol
  pool.symbol = LPtoken.symbol

  pool.save()

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress.toHexString())
  poolDeposits.valueInt = INT_ZERO
  poolDeposits.save()

  // create the tracked contract based on the template
  PairTemplate.create(poolAddress)
}

export function UpdateTokenWhitelists(tokenTracker0: _TokenTracker, tokenTracker1: _TokenTracker, poolAddress: Address): void {
    // update white listed pools
    if (WHITELIST.includes(tokenTracker0.id)) {
      let newPools = tokenTracker1.whitelistPools
      newPools.push(poolAddress.toHexString())
      tokenTracker1.whitelistPools = newPools
      tokenTracker1.save()
    }
  
    if (WHITELIST.includes(tokenTracker1.id)) {
      let newPools = tokenTracker0.whitelistPools
      newPools.push(poolAddress.toHexString())
      tokenTracker0.whitelistPools = newPools
      tokenTracker0.save()
    }
}

export function updateInputTokenBalances(poolAddress: string, reserve0: BigInt, reserve1: BigInt): void {

  let pool = getLiquidityPool(poolAddress)

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals)
  let tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals)

  pool.inputTokenBalances = [tokenDecimal0, tokenDecimal1]

  pool.save()
}

export function updateTvlAndTokenPrices(poolAddress: string): void {
  let pool = getLiquidityPool(poolAddress)

  let protocol = getOrCreateDex()

  // Get updated ETH price now that reserves could have changed

  let ether = getOrCreateEtherHelper()

  ether.valueDecimal = getEthPriceInUSD()

  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)


  // Get new tvl
  let newTvl = tokenTracker0.derivedETH.times(pool.inputTokenBalances[0]).times(ether.valueDecimal!).plus(tokenTracker1.derivedETH.times(pool.inputTokenBalances[1]).times(ether.valueDecimal!))

  // Add the new pool tvl
  pool.totalValueLockedUSD =  newTvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl)


  // Update LP token prices
  if (pool.outputTokenSupply == BIGDECIMAL_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  else pool.outputTokenPriceUSD = newTvl.div(pool.outputTokenSupply)


  pool.save()
  protocol.save()
  ether.save()
}

// Checks if the mint has been completed with the Deposit event. 
function isCompleteMint(mintId: string): boolean {
  let mint = getMint(mintId)
  if (mint == null) return false
  return mint.from !== null // sufficient checks
}

export function handleTransferMint(event: ethereum.Event, value: BigDecimal, to: Address): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let transaction = getOrCreateTransaction(event)
  
  // Tracks supply of minted LP tokens 
  pool.outputTokenSupply = pool.outputTokenSupply.plus(value)
  pool.save()

  let mints = transaction.mints

  // create new mint if no mints so far or if last one is done already
  if (mints == null || isCompleteMint(mints[mints.length - 1])) {
    
    let length = mints == null ? 0: mints.length

    let mint = createMint(event, length)

    mint.to = to
    mint.liquidity = value

    // update mints in transaction
    if (mints == null) transaction.mints = [mint.id]
    else transaction.mints = mints.concat([mint.id])

    // save entities
    transaction.save()
    mint.save()
  }

  // This is done to remove a potential feeto mint --- Not active 
  else if (!isCompleteMint(mints[mints.length - 1])) {
    store.remove('Mint', mints[mints.length - 1])

    let mint = createMint(event, mints.length)

    mint.to = to
    mint.liquidity = value
  
    // update mints in transaction
    mints.pop()
    transaction.mints = mints.concat([mint.id])
  
    // save entities
    transaction.save()
    mint.save()
  }
}

export function handleTransferToPool(event: ethereum.Event, value: BigDecimal, to: Address, from: Address): void {
  let transaction = getOrCreateTransaction(event)

  let burns = transaction.burns
  let length = burns == null ? 0: burns.length
  let burn = createBurn(event, length)

  burn.liquidity = value
  burn.to = to
  burn.sender = from
  burn.needsComplete = true

  // update burns in transaction
  if (burns == null) transaction.burns = [burn.id]
  else transaction.burns = burns.concat([burn.id])

  // save entities
  transaction.save()
  burn.save()
}

export function handleTransferBurn(event: ethereum.Event, value: BigDecimal, to: Address, from: Address): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let transaction = getOrCreateTransaction(event)

  // Tracks supply of minted LP tokens 
  pool.outputTokenSupply = pool.outputTokenSupply.minus(value)

  // this is a new instance of a logical burn
  let burns = transaction.burns
  let burn: BurnEvent
  
  if (burns != null) {
    let currentBurn = getBurn(burns[burns.length - 1])

    if (currentBurn != null && currentBurn.needsComplete) {
      burn = currentBurn as BurnEvent
    } 
    
    else {
      burn = createBurn(event, burns.length)

      burn.needsComplete = false
      burn.liquidity = value
      burn.to = to
      burn.sender = from
    }
  } 
  
  else {
    burn = createBurn(event, INT_ZERO)
    burn.needsComplete = false
    burn.liquidity = value
    burn.to = to
    burn.sender = from
  }

  let mints = transaction.mints
  // if this logical burn included a fee mint, account for this
  if (mints != null && !isCompleteMint(mints[mints.length - 1])) {
    // remove the logical mint
    store.remove('_Mint', mints[mints.length - 1])
    // update the transaction
    // TODO: Consider using .slice().pop() to protect against unintended
    // side effects for other code paths.
    mints.pop()
    transaction.mints = mints
    transaction.save()
  }
  burn.save()
  // if accessing last one, replace it
  if (burn.needsComplete) {
    // TODO: Consider using .slice(0, -1).conc at() to protect against
    // unintended side effects for other code paths.

    if (burns != null) burns[burns.length - 1] = burn.id
    else burns = [burn.id]
  }
  // else add new one
  else {
    if (burns == null) transaction.burns = [burn.id]
    else transaction.burns = burns.concat([burn.id])
  }
  transaction.burns = burns
  transaction.save()
  pool.save()
}

export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt, sender: Address): void {
  let transaction = getOrCreateTransaction(event)

  let mints = transaction.mints!
  let mint = getMint(mints[mints.length - 1])

  let pool = getLiquidityPool(event.address.toHexString())

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals)
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals)

  let ether = getOrCreateEtherHelper()

  // Gets token value in USD
  let token0USD = tokenTracker0.derivedETH.times(ether.valueDecimal!)
  let token1USD = tokenTracker1.derivedETH.times(ether.valueDecimal!)

  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  deposit.hash = event.transaction.hash.toHexString()
  deposit.logIndex = event.logIndex.toI32()
  deposit.protocol = FACTORY_ADDRESS
  deposit.to = mint.to.toHexString()
  deposit.from = sender.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  deposit.outputTokens = pool.outputToken
  deposit.inputTokenAmounts = [token0Amount, token1Amount]
  deposit.outputTokenAmount = mint.liquidity
  deposit.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))

  mint.from = sender

  UpdateDepositHelper(event.address)

  deposit.save()
  mint.save()
}

export function createWithdraw(event: ethereum.Event, amount0: BigInt, amount1: BigInt, sender: Address, to: Address): void {
  let transaction = getOrCreateTransaction(event)

  let burns = transaction.burns!
  let burn = getBurn(burns[burns.length - 1])

  let pool = getLiquidityPool(event.address.toHexString())

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals)
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals)

  let ether = getOrCreateEtherHelper()

  // Gets token value in USD
  let token0USD = tokenTracker0.derivedETH.times(ether.valueDecimal!)
  let token1USD = tokenTracker1.derivedETH.times(ether.valueDecimal!)

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  withdrawal.hash = event.transaction.hash.toHexString()
  withdrawal.logIndex = event.logIndex.toI32()
  withdrawal.protocol = FACTORY_ADDRESS
  withdrawal.to = to.toHexString()
  withdrawal.from = sender.toHexString()
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  withdrawal.outputTokens = pool.outputToken
  withdrawal.inputTokenAmounts = [token0Amount, token1Amount]
  withdrawal.outputTokenAmount = burn.liquidity
  withdrawal.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))


  withdrawal.save()
}

export function createSwapHandleVolumeAndFees(event: ethereum.Event, to: Address, sender: Address, amount0In: BigInt, amount1In: BigInt, amount0Out: BigInt, amount1Out: BigInt): void {

  let protocol = getOrCreateDex()
  let pool = getLiquidityPool(event.address.toHexString())

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  let amount0InConverted = convertTokenToDecimal(amount0In, token0.decimals)
  let amount1InConverted = convertTokenToDecimal(amount1In, token1.decimals)
  let amount0OutConverted = convertTokenToDecimal(amount0Out, token0.decimals)
  let amount1OutConverted = convertTokenToDecimal(amount1Out, token1.decimals)

  // totals for volume updates
  let amount0Total = amount0OutConverted.plus(amount0InConverted)
  let amount1Total = amount1OutConverted.plus(amount1InConverted)

  // ETH/USD prices
  let ether = getOrCreateEtherHelper()

  let token0USD = tokenTracker0.derivedETH.times(amount0Total).times(ether.valueDecimal!)
  let token1USD = tokenTracker1.derivedETH.times(amount1Total).times(ether.valueDecimal!)

  // /// get total amounts of derived USD for tracking
  // let derivedAmountUSD = token1USD.plus(token0USD).div(BigDecimal.fromString(INT_TWO))

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, tokenTracker0 as _TokenTracker, amount1Total, tokenTracker1 as _TokenTracker, pool as LiquidityPool)

  var feeToken: BigDecimal
  var feeUSD: BigDecimal

  if (amount0InConverted != BIGDECIMAL_ZERO) {
    feeToken = amount0InConverted.times(BigDecimal.fromString(SWAP_FEE))
    feeUSD = feeToken.times(tokenTracker0.derivedETH).times(ether.valueDecimal!)
  } else {
    feeToken = amount1InConverted.times(BigDecimal.fromString(SWAP_FEE))
    feeUSD = feeToken.times(tokenTracker1.derivedETH).times(ether.valueDecimal!)
  }

  let swap = new SwapEvent(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  // update swap event
  swap.hash = event.transaction.hash.toHexString()
  swap.logIndex = event.logIndex.toI32()
  swap.protocol = protocol.id
  swap.to = to.toHexString()
  swap.from = sender.toHexString()
  swap.blockNumber = event.block.number
  swap.timestamp = event.block.timestamp
  swap.tokenIn = amount0InConverted != BIGDECIMAL_ZERO ? token0.id : token1.id
  swap.amountIn = amount0InConverted != BIGDECIMAL_ZERO ? amount0InConverted : amount1InConverted
  swap.amountInUSD = amount0InConverted != BIGDECIMAL_ZERO ? token0USD : token1USD
  swap.tokenOut = amount0OutConverted != BIGDECIMAL_ZERO ? token0.id : token1.id
  swap.amountOut = amount0OutConverted != BIGDECIMAL_ZERO ? amount0OutConverted : amount1OutConverted
  swap.amountOutUSD = amount0OutConverted != BIGDECIMAL_ZERO ? token0USD : token1USD
  swap.pool = pool.id

  swap.save()

  updateVolumeAndFees(event, trackedAmountUSD, feeUSD)
}


export function UpdateDepositHelper(poolAddress: Address): void {
  let poolDeposits = _HelperStore.load(poolAddress.toHexString())!
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE
  poolDeposits.save()
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BigDecimal.fromString('10'))
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