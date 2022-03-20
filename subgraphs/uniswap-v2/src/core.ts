/* eslint-disable prefer-const */
import { BigInt, BigDecimal, store, log } from '@graphprotocol/graph-ts'
import {
  Deposit,
  Withdraw, 
  Swap as SwapEvent,
  LiquidityPool,
  DexAmmProtocol,
  Token,
  _Transaction, 
  _Mint as MintEvent, 
  _Burn as BurnEvent,
  _PricesUSD,
  _TokenTracker
} from './../generated/schema'

import { Mint, Burn, Swap, Transfer, Sync } from '../generated/templates/Pair/Pair'
import { getEthPriceInUSD, findEthPerToken, getTrackedVolumeUSD } from './common/price'
import {
  updateFinancials,
  updateUsageMetrics,
  convertTokenToDecimal,
  updatePoolMetrics,
  updateVolumeAndFees
} from './common/helpers'
import {
  DEFAULT_DECIMALS,
  FACTORY_ADDRESS,
  ZERO_ADDRESS,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
} from './common/constants'

function isCompleteMint(mintId: string): boolean {
  let mint = MintEvent.load(mintId)
  if (mint == null) return false
  return mint.from !== null // sufficient checks
}

export function handleTransfer(event: Transfer): void {

  // get pair and load contract
  let pool = LiquidityPool.load(event.address.toHex())

  if (pool == null) {
    log.debug('pool was null', [])
    return
  }

  let transactionHash = event.transaction.hash.toHex()

  // user stats
  let from = event.params.from
  let to = event.params.to

  // liquidity token amount being transfered
  let value = convertTokenToDecimal(event.params.value, BigInt.fromI32(DEFAULT_DECIMALS))

  // ignore initial transfers for first adds
  if (to.toHex() == ZERO_ADDRESS && event.params.value.equals(BigInt.fromI32(1000))) {
    return
  }

  // get or create transaction
  let transaction = _Transaction.load(transactionHash)
  if (transaction == null) {
    transaction = new _Transaction(transactionHash)
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
  }


  // mints
  let mints = transaction.mints
  if (from.toHex() == ZERO_ADDRESS) {
    // update total supply
    pool.outputTokenSupply = pool.outputTokenSupply.plus(value)
    pool.save()

    // create new mint if no mints so far or if last one is done already
    if (mints == null || isCompleteMint(mints[mints.length - 1])) {
      

      let length = mints == null ? 0: mints.length

      let mint = new MintEvent(
        event.transaction.hash
          .toHex()
          .concat('-')
          .concat(BigInt.fromI32(length).toString())
      )

      mint.to = to
      mint.liquidity = value

      mint.save()

      // update mints in transaction
      if (mints == null) transaction.mints = [mint.id]
      else transaction.mints = mints.concat([mint.id])

      // save entities
      transaction.save()

    } 
    // This is done to remove a potential feeto mint
    //else if (!isCompleteMint(mints[mints.length - 1])) {
        //store.remove('Mint', mints[mints.length - 1])

        //let mint = new MintEvent(
          //event.transaction.hash
            //.toHex()
            //.concat('-')
            //.concat(BigInt.fromI32(mints.length).toString())
        //)

        //mint.to = to
        //mint.liquidity = value

        //mint.save()
  
        // update mints in transaction
        //mints.pop()
        //transaction.mints = mints.concat([mint.id])
  
        // save entities
        //transaction.save()
    //}
  }

  // case where direct send first on ETH withdrawls
  if (event.params.to.toHex() == pool.id) {
    let burns = transaction.burns
    let length = burns == null ? 0: burns.length
    let burn = new BurnEvent(
      event.transaction.hash
        .toHex()
        .concat('-')
        .concat(BigInt.fromI32(length).toString())
    )

    burn.liquidity = value
    burn.to = event.params.to
    burn.sender = event.params.from
    burn.needsComplete = true
    burn.save()

    if (burns == null) transaction.burns = [burn.id]
    else transaction.burns = burns.concat([burn.id])

    transaction.save()
  }

  // burn
  if (event.params.to.toHex() == ZERO_ADDRESS && event.params.from.toHex() == pool.id) {
    pool.outputTokenSupply = pool.outputTokenSupply.minus(value)
    pool.save()

    // this is a new instance of a logical burn
    let burns = transaction.burns
    let burn: BurnEvent
    if (burns != null) {
      let currentBurn = BurnEvent.load(burns[burns.length - 1])
      if (currentBurn != null && currentBurn.needsComplete) {
        burn = currentBurn as BurnEvent
      } else {
        burn = new BurnEvent(
          event.transaction.hash
            .toHex()
            .concat('-')
            .concat(BigInt.fromI32(burns.length).toString())
        )

        burn.needsComplete = false
        burn.liquidity = value
        burn.to = event.params.to
        burn.sender = event.params.from
      }
    } else {
      burn = new BurnEvent(
        event.transaction.hash
          .toHex()
          .concat('-')
          .concat(BigInt.fromI32(0).toString())
      )

      burn.needsComplete = false
      burn.liquidity = value
      burn.to = event.params.to
      burn.sender = event.params.from

    }

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
      // TODO: Consider using .concat() for handling array updates to protect
      // against unintended side effects for other code paths.
      if (burns == null) transaction.burns = [burn.id]
      else transaction.burns = burns.concat([burn.id])
    }
    transaction.burns = burns
    transaction.save()
  }

  transaction.save()
}

export function handleSync(event: Sync): void {
  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return

  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])
  let tokenTracker0 = _TokenTracker.load(pool.inputTokens[0])
  let tokenTracker1 = _TokenTracker.load(pool.inputTokens[1])

  if (token0 == null) return
  if (token1 == null) return
  if (tokenTracker0 == null) return
  if (tokenTracker1 == null) return

  let tokenDecimal0 = convertTokenToDecimal(event.params.reserve0, BigInt.fromI32(token0.decimals))
  let tokenDecimal1 = convertTokenToDecimal(event.params.reserve1, BigInt.fromI32(token1.decimals))

  pool.inputTokenBalances = [tokenDecimal0, tokenDecimal1]
  
  pool.save()


  // // update ETH price now that reserves could have changed
  let ether = _PricesUSD.load('ETH')
  if (ether == null) return
  let tvl = _PricesUSD.load('ETH')
  if (tvl == null) return

  ether.valueUSD = getEthPriceInUSD()
  
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)
  tokenTracker0.save()
  tokenTracker1.save()
  

  tvl.valueUSD = tvl.valueUSD.minus(pool.totalValueLockedUSD)
  let newTvl = tokenTracker0.derivedETH.times(pool.inputTokenBalances[0]).plus(tokenTracker1.derivedETH.times(pool.inputTokenBalances[1]))
  
  pool.totalValueLockedUSD =  newTvl
  pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(pool.outputTokenSupply)

  tvl.valueUSD = tvl.valueUSD.plus(pool.totalValueLockedUSD)

  ether.save()
  tvl.save()
  pool.save()
}


export function handleMint(event: Mint): void {
  let transaction = _Transaction.load(event.transaction.hash.toHex())
  if (transaction == null) return

  let mints = transaction.mints
  if (mints == null) return

  let mint = MintEvent.load(mints[mints.length - 1])
  if (mint == null) return


  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return


  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if (protocol == null) return


  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])
  let tokenTracker0 = _TokenTracker.load(pool.inputTokens[0])
  let tokenTracker1 = _TokenTracker.load(pool.inputTokens[1])

  if (token0 == null) return
  if (token1 == null) return
  if (tokenTracker0 == null) return
  if (tokenTracker1 == null) return

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(event.params.amount0, BigInt.fromI32(token0.decimals))
  let token1Amount = convertTokenToDecimal(event.params.amount1, BigInt.fromI32(token1.decimals))

  let ether = _PricesUSD.load('ETH')
  if (ether == null) return

  let token0USD = tokenTracker0.derivedETH.times(ether.valueUSD)
  let token1USD = tokenTracker1.derivedETH.times(ether.valueUSD)

  let deposit = new Deposit(
    event.transaction.hash
      .toString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  deposit.hash = event.transaction.hash.toString()
  deposit.logIndex = event.logIndex.toI32()
  deposit.protocol = protocol.id
  deposit.to = mint.to.toString()
  deposit.from = event.params.sender.toString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = pool.inputTokens
  deposit.outputTokens = pool.outputToken
  deposit.inputTokenAmounts = [token0Amount, token1Amount]
  deposit.outputTokenAmount = mint.liquidity
  deposit.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))

  mint.from = event.params.sender


  mint.save()
  deposit.save()
  pool.save()

  updateFinancials(event.block.number, event.block.timestamp)
  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.sender)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
}

export function handleBurn(event: Burn): void {
  let transaction = _Transaction.load(event.transaction.hash.toHex())
  if (transaction == null) return

  let burns = transaction.burns
  if (burns == null) return
  

  let burn = BurnEvent.load(burns[burns.length - 1])
  if (burn == null) return
  

  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return
  

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if (protocol == null) return
  

  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])
  let tokenTracker0 = _TokenTracker.load(pool.inputTokens[0])
  let tokenTracker1 = _TokenTracker.load(pool.inputTokens[1])

  if (token0 == null) return
  if (token1 == null) return
  if (tokenTracker0 == null) return
  if (tokenTracker1 == null) return

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(event.params.amount0, BigInt.fromI32(token0.decimals))
  let token1Amount = convertTokenToDecimal(event.params.amount1, BigInt.fromI32(token1.decimals))

  let ether = _PricesUSD.load('ETH')
  if (ether == null) return

  let token0USD = tokenTracker0.derivedETH.times(ether.valueUSD)
  let token1USD = tokenTracker1.derivedETH.times(ether.valueUSD)

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  withdrawal.hash = event.transaction.hash.toString()
  withdrawal.logIndex = event.logIndex.toI32()
  withdrawal.protocol = protocol.id
  withdrawal.to = event.params.to.toString()
  withdrawal.from = event.params.sender.toString()
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = pool.inputTokens
  withdrawal.outputTokens = pool.outputToken
  withdrawal.inputTokenAmounts = [token0Amount, token1Amount]
  withdrawal.outputTokenAmount = burn.liquidity
  withdrawal.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))


  updateUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from)
  updateFinancials(event.block.number, event.block.timestamp)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
  
  burn.save()
  withdrawal.save()
  pool.save()
}



export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if(protocol == null) return

  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])
  let tokenTracker0 = _TokenTracker.load(pool.inputTokens[0])
  let tokenTracker1 = _TokenTracker.load(pool.inputTokens[1])
  
  if (token0 == null) return
  if (token1 == null) return
  if (tokenTracker0 == null) return
  if (tokenTracker1 == null) return


  let amount0In = convertTokenToDecimal(event.params.amount0In, BigInt.fromI32(token0.decimals))
  let amount1In = convertTokenToDecimal(event.params.amount1In, BigInt.fromI32(token1.decimals))
  let amount0Out = convertTokenToDecimal(event.params.amount0Out, BigInt.fromI32(token0.decimals))
  let amount1Out = convertTokenToDecimal(event.params.amount1Out, BigInt.fromI32(token1.decimals))

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In)
  let amount1Total = amount1Out.plus(amount1In)

  // ETH/USD prices
  let ether = _PricesUSD.load('ETH')
  if (ether == null) return

  let token0USD = tokenTracker0.derivedETH.times(amount0Total).times(ether.valueUSD)
  let token1USD = tokenTracker0.derivedETH.times(amount1Total).times(ether.valueUSD)

  /// get total amounts of derived USD for tracking
  /// let derivedAmountUSD = token1USD.plus(token0USD).div(BigDecimal.fromString('2'))

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, tokenTracker0 as _TokenTracker, amount1Total, tokenTracker1 as _TokenTracker, pool as LiquidityPool)

  let trackedAmountETH: BigDecimal
  if (ether.valueUSD.equals(BIGDECIMAL_ZERO)) {
    trackedAmountETH = BIGDECIMAL_ZERO
  } else {
    trackedAmountETH = trackedAmountUSD.div(ether.valueUSD)
  }

  var feeToken: BigDecimal
  var feeUSD: BigDecimal

  if (amount0In != BIGDECIMAL_ZERO) {
    feeToken = amount0In.times(BigDecimal.fromString('0.03'))
    feeUSD = feeToken.times(tokenTracker0.derivedETH).times(ether.valueUSD)
  } else {
    feeToken = amount1In.times(BigDecimal.fromString('0.03'))
    feeUSD = feeToken.times(tokenTracker1.derivedETH).times(ether.valueUSD)
  }


  let swap = new SwapEvent(
    event.transaction.hash
      .toHex()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  // update swap event
  swap.hash = event.transaction.hash.toString()
  swap.logIndex = event.logIndex.toI32()
  swap.protocol = protocol.id
  swap.to = event.params.to.toString()
  swap.from = event.params.sender.toString()
  swap.blockNumber = event.block.number
  swap.timestamp = event.block.timestamp
  swap.tokenIn = amount0In != BIGDECIMAL_ZERO ? token0.id : token1.id
  swap.amountIn = amount0In != BIGDECIMAL_ZERO ? amount0In : amount1In
  swap.amountInUSD = amount0In != BIGDECIMAL_ZERO ? token0USD : token1USD
  swap.tokenOut = amount0Out != BIGDECIMAL_ZERO ? token0.id : token1.id
  swap.amountOut = amount0Out != BIGDECIMAL_ZERO ? amount0Out : amount1Out
  swap.amountOutUSD = amount0Out != BIGDECIMAL_ZERO ? token0USD : token1USD
  swap.pool = pool.id


  updateFinancials(event.block.number, event.block.timestamp)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.sender)
  updateVolumeAndFees(event.block.timestamp, trackedAmountUSD, feeUSD, pool)

  swap.save()
  pool.save()

}