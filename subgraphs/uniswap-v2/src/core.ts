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
  _HelperStore,
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
  BIGDECIMAL_ONE,
  INT_ONE,
} from './common/constants'

// Checks if the mint has been completed with the Deposit event. 
function isCompleteMint(mintId: string): boolean {
  let mint = MintEvent.load(mintId)
  if (mint == null) return false
  return mint.from !== null // sufficient checks
}

export function handleTransfer(event: Transfer): void {

  // get pair and load contract
  let pool = LiquidityPool.load(event.address.toHexString())

  if (pool == null) {
    log.warning('pool was null', [])
    return
  }

  let transactionHash = event.transaction.hash.toHexString()

  // user stats
  let from = event.params.from
  let to = event.params.to

  // liquidity token amount being transfered
  let value = convertTokenToDecimal(event.params.value, DEFAULT_DECIMALS)

  // ignore initial transfers for first adds
  if (to.toHexString() == ZERO_ADDRESS && event.params.value.equals(BigInt.fromI32(1000))) {
    return
  }

  // get or create transaction for trackign mints and burns 
  let transaction = _Transaction.load(transactionHash)
  if (transaction == null) {

    
    transaction = new _Transaction(transactionHash)
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
  }

  // mints
  let mints = transaction.mints
  if (from.toHexString() == ZERO_ADDRESS) {
    // Tracks supply of minted LP tokens 
    pool.outputTokenSupply = pool.outputTokenSupply.plus(value)
    pool.save()

    // create new mint if no mints so far or if last one is done already
    if (mints == null || isCompleteMint(mints[mints.length - 1])) {
      

      let length = mints == null ? 0: mints.length

      let mint = new MintEvent(
        event.transaction.hash
          .toHexString()
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
    // This is done to remove a potential feeto mint --- Not active 

    //else if (!isCompleteMint(mints[mints.length - 1])) {
        //store.remove('Mint', mints[mints.length - 1])

        //let mint = new MintEvent(
          //event.transaction.hash
            //.toHexString()
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

  // Case where direct send first on ETH withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  if (event.params.to.toHexString() == pool.id) {
    let burns = transaction.burns
    let length = burns == null ? 0: burns.length
    let burn = new BurnEvent(
      event.transaction.hash
        .toHexString()
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
  if (event.params.to.toHexString() == ZERO_ADDRESS && event.params.from.toHexString() == pool.id) {
    // Tracks supply of minted LP tokens 
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
            .toHexString()
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
          .toHexString()
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
      if (burns == null) transaction.burns = [burn.id]
      else transaction.burns = burns.concat([burn.id])
    }
    transaction.burns = burns
    transaction.save()
  }

  transaction.save()
}

export function handleSync(event: Sync): void {
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if (protocol == null) return

  let pool = LiquidityPool.load(event.address.toHexString())
  if (pool == null) return

  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])
  let tokenTracker0 = _TokenTracker.load(pool.inputTokens[0])
  let tokenTracker1 = _TokenTracker.load(pool.inputTokens[1])

  if (token0 == null) return
  if (token1 == null) return
  if (tokenTracker0 == null) return
  if (tokenTracker1 == null) return

  let tokenDecimal0 = convertTokenToDecimal(event.params.reserve0, token0.decimals)
  let tokenDecimal1 = convertTokenToDecimal(event.params.reserve1, token1.decimals)

  pool.inputTokenBalances = [tokenDecimal0, tokenDecimal1]
  
  pool.save()

  // // update ETH price now that reserves could have changed
  let ether = _HelperStore.load('ETH')
  if (ether == null) return

  ether.valueDecimal = getEthPriceInUSD()

  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)
  tokenTracker0.save()
  tokenTracker1.save()

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)
  let newTvl = tokenTracker0.derivedETH.times(pool.inputTokenBalances[0]).times(ether.valueDecimal!).plus(tokenTracker1.derivedETH.times(pool.inputTokenBalances[1]).times(ether.valueDecimal!))
  pool.totalValueLockedUSD =  newTvl

  if (pool.outputTokenSupply == BIGDECIMAL_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  else pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(pool.outputTokenSupply)

  // Add the new pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD)

  log.warning("Hello3", [])

  ether.save()
  protocol.save()
  pool.save()
}


export function handleMint(event: Mint): void {
  let transaction = _Transaction.load(event.transaction.hash.toHexString())
  if (transaction == null) return

  let mints = transaction.mints
  if (mints == null) return

  let mint = MintEvent.load(mints[mints.length - 1])
  if (mint == null) return


  let pool = LiquidityPool.load(event.address.toHexString())
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
  let token0Amount = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let token1Amount = convertTokenToDecimal(event.params.amount1, token1.decimals)

  let ether = _HelperStore.load('ETH')
  if (ether == null) return

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
  deposit.protocol = protocol.id
  deposit.to = mint.to.toHexString()
  deposit.from = event.params.sender.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  deposit.outputTokens = pool.outputToken
  deposit.inputTokenAmounts = [token0Amount, token1Amount]
  deposit.outputTokenAmount = mint.liquidity
  deposit.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))

  mint.from = event.params.sender


  let poolDeposits = _HelperStore.load(event.address.toHexString())
  if (poolDeposits == null) return
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE

  mint.save()
  deposit.save()
  pool.save()
  poolDeposits.save()

  updateFinancials(event.block.number, event.block.timestamp)
  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.sender)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
}

export function handleBurn(event: Burn): void {
  let transaction = _Transaction.load(event.transaction.hash.toHexString())
  if (transaction == null) return

  let burns = transaction.burns
  if (burns == null) return
  

  let burn = BurnEvent.load(burns[burns.length - 1])
  if (burn == null) return
  

  let pool = LiquidityPool.load(event.address.toHexString())
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
  let token0Amount = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let token1Amount = convertTokenToDecimal(event.params.amount1, token1.decimals)

  let ether = _HelperStore.load('ETH')
  if (ether == null) return

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
  withdrawal.protocol = protocol.id
  withdrawal.to = event.params.to.toHexString()
  withdrawal.from = event.params.sender.toHexString()
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
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
  let pool = LiquidityPool.load(event.address.toHexString())
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


  let amount0In = convertTokenToDecimal(event.params.amount0In, token0.decimals)
  let amount1In = convertTokenToDecimal(event.params.amount1In, token1.decimals)
  let amount0Out = convertTokenToDecimal(event.params.amount0Out, token0.decimals)
  let amount1Out = convertTokenToDecimal(event.params.amount1Out, token1.decimals)

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In)
  let amount1Total = amount1Out.plus(amount1In)

  // ETH/USD prices
  let ether = _HelperStore.load('ETH')
  if (ether == null) return

  let token0USD = tokenTracker0.derivedETH.times(amount0Total).times(ether.valueDecimal!)
  let token1USD = tokenTracker1.derivedETH.times(amount1Total).times(ether.valueDecimal!)

  /// get total amounts of derived USD for tracking
  let derivedAmountUSD = token1USD.plus(token0USD).div(BigDecimal.fromString('2'))

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, tokenTracker0 as _TokenTracker, amount1Total, tokenTracker1 as _TokenTracker, pool as LiquidityPool)

  let trackedAmountETH: BigDecimal
  if (ether.valueDecimal!.equals(BIGDECIMAL_ZERO)) {
    trackedAmountETH = BIGDECIMAL_ZERO
  } else {
    trackedAmountETH = trackedAmountUSD.div(ether.valueDecimal!)
  }

  var feeToken: BigDecimal
  var feeUSD: BigDecimal

  if (amount0In != BIGDECIMAL_ZERO) {
    feeToken = amount0In.times(BigDecimal.fromString('0.03'))
    feeUSD = feeToken.times(tokenTracker0.derivedETH).times(ether.valueDecimal!)
  } else {
    feeToken = amount1In.times(BigDecimal.fromString('0.03'))
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
  swap.to = event.params.to.toHexString()
  swap.from = event.params.sender.toHexString()
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