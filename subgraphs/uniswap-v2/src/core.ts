/* eslint-disable prefer-const */
import { BigInt, BigDecimal, store } from '@graphprotocol/graph-ts'
import {
  Deposit,
  Withdraw, 
  Swap as SwapEvent,
  LiquidityPool,
  DexAmmProtocol,
  Token,
  Transaction, 
  Mint as MintEvent, 
  Burn as BurnEvent,
  Bundle
} from '../generated/schema'

import { Pair as PairContract, Mint, Burn, Swap, Transfer, Sync } from '../generated/templates/Pair/Pair'
import { getEthPriceInUSD, findEthPerToken, getTrackedVolumeUSD } from './common/price'
import {
  updateFinancials,
  updateUsageMetrics,
  convertTokenToDecimal,
  getPriceInUSD,
  updatePoolMetrics,
  updateVolumeAndFees
} from './common/helpers'
import {
  DEFAULT_DECIMALS,
  FACTORY_ADDRESS,
  ZERO_ADDRESS,
  BIGDECIMAL_ZERO,
} from './common/constants'

function isCompleteMint(mintId: string): boolean {
  return MintEvent.load(mintId).sender !== null // sufficient checks
}

export function handleTransfer(event: Transfer): void {

  // get pair and load contract
  let pool = LiquidityPool.load(event.address.toHexString())

  if (pool == null) {
    return
  }

  let transactionHash = event.transaction.hash.toHexString()

  // user stats
  let from = event.params.from
  let to = event.params.to

  // liquidity token amount being transfered
  let value = convertTokenToDecimal(event.params.value, BigInt.fromI32(DEFAULT_DECIMALS))

  // ignore initial transfers for first adds
  if (to.toHexString() == ZERO_ADDRESS && event.params.value.equals(BigInt.fromI32(1000))) {
    return
  }

  // get or create transaction
  let transaction = Transaction.load(transactionHash)
  if (transaction == null) {
    transaction = new Transaction(transactionHash)
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.mints = []
    transaction.burns = []
  }

  if (transaction.mints == null) {
    transaction.mints = []
  }
  if (transaction.burns == null) {
    transaction.burns = []
  }

  // mints
  let mints = transaction.mints
  if (from.toHexString() == ZERO_ADDRESS) {
    // update total supply
    pool.outputTokenSupply = pool.outputTokenSupply.plus(value)
    pool.save()

    // create new mint if no mints so far or if last one is done already
    if (mints.length === 0 || isCompleteMint(mints[mints.length - 1])) {
      let mint = new MintEvent(
        event.transaction.hash
          .toHexString()
          .concat('-')
          .concat(BigInt.fromI32(mints.length).toString())
      )

      mint.to = to
      mint.liquidity = value

      mint.save()

      // update mints in transaction
      transaction.mints = mints.concat([mint.id])

      // save entities
      transaction.save()

    } 
    // This is done to remove a potential feeto mint
    else if (!isCompleteMint(mints[mints.length - 1])) {
        store.remove('Mint', mints[mints.length - 1])

        let mint = new MintEvent(
          event.transaction.hash
            .toHexString()
            .concat('-')
            .concat(BigInt.fromI32(mints.length).toString())
        )

        mint.to = to
        mint.liquidity = value

        mint.save()
  
        // update mints in transaction
        mints.pop()
        transaction.mints = mints.concat([mint.id])
  
        // save entities
        transaction.save()
    }
  }

  // case where direct send first on ETH withdrawls
  if (event.params.to.toHexString() == pool.id) {
    let burns = transaction.burns
    let burn = new BurnEvent(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(BigInt.fromI32(burns.length).toString())
    )

    burn.liquidity = value
    burn.to = event.params.to
    burn.sender = event.params.from
    burn.needsComplete = true
    burn.save()

    // TODO: Consider using .concat() for handling array updates to protect
    // against unintended side effects for other code paths.
    transaction.burns = burns.concat([burn.id])
    transaction.burns = burns
    transaction.save()
  }

  // burn
  if (event.params.to.toHexString() == ZERO_ADDRESS && event.params.from.toHexString() == pool.id) {
    pool.outputTokenSupply = pool.outputTokenSupply.minus(value)
    pool.save()

    // this is a new instance of a logical burn
    let burns = transaction.burns
    let burn: BurnEvent
    if (burns.length > 0) {
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
          .concat(BigInt.fromI32(burns.length).toString())
      )

      burn.needsComplete = false
      burn.liquidity = value
      burn.to = event.params.to
      burn.sender = event.params.from

    }

    // if this logical burn included a fee mint, account for this
    if (mints.length !== 0 && !isCompleteMint(mints[mints.length - 1])) {
      // remove the logical mint
      store.remove('Mint', mints[mints.length - 1])
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
      burns[burns.length - 1] = burn.id
    }
    // else add new one
    else {
      // TODO: Consider using .concat() for handling array updates to protect
      // against unintended side effects for other code paths.
      burns.push(burn.id)
    }
    transaction.burns = burns
    transaction.save()
  }

  transaction.save()
}

export function handleSync(event: Sync): void {
  let pool = LiquidityPool.load(event.address.toHex())

  let token0 = Token.load(pool.inputTokens[0])
  let token1 = Token.load(pool.inputTokens[1])

  let token0USD = getPriceInUSD(token0)
  let token1USD = getPriceInUSD(token1)

  let newTvl = token0USD.times(pool.inputTokenBalances[0]).plus(token1USD.times(pool.inputTokenBalances[1]))

  pool.inputTokenBalances[0] = convertTokenToDecimal(event.params.reserve0, BigInt.fromI32(pool.inputTokens[0].decimals))
  pool.inputTokenBalances[1] = convertTokenToDecimal(event.params.reserve1, BigInt.fromI32(pool.inputTokens[1].decimals))
  pool.totalValueLockedUSD =  newTvl
  pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(pool.outputTokenSupply)

  // update ETH price now that reserves could have changed
  let bundle = Bundle.load('1')
  bundle.ethPrice = getEthPriceInUSD()
  bundle.save()

  pool.save()
}


export function handleMint(event: Mint): void {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction == null) return

  let mints = transaction.mints
  if (mints == null) return

  let mint = MintEvent.load(mints[mints.length - 1])
  if (mint == null) return


  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return


  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if (protocol == null) return


  let poolToken0 = Token.load(pool.inputTokens[0])
  let poolToken1 = Token.load(pool.inputTokens[1])

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(event.params.amount0, BigInt.fromI32(poolToken0.decimals))
  let token1Amount = convertTokenToDecimal(event.params.amount1, BigInt.fromI32(poolToken1.decimals))

  let bundle = Bundle.load('1')
  let token0USD = findEthPerToken(poolToken0).times(bundle.ethPrice)
  let token1USD = findEthPerToken(poolToken1).times(bundle.ethPrice)

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


  mint.save()
  deposit.save()
  pool.save()

  updateFinancials(event.block.number, event.block.timestamp)
  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.sender)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
}

export function handleBurn(event: Burn): void {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction == null) return

  let burns = transaction.burns
  if (burns == null) return
  

  let burn = BurnEvent.load(burns[burns.length - 1])
  if (burn == null) return
  

  let pool = LiquidityPool.load(event.address.toHex())
  if (pool == null) return
  

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  if (protocol == null) return
  

  let poolToken0 = Token.load(pool.inputTokens[0])
  let poolToken1 = Token.load(pool.inputTokens[1])

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(event.params.amount0, BigInt.fromI32(poolToken0.decimals))
  let token1Amount = convertTokenToDecimal(event.params.amount1, BigInt.fromI32(poolToken1.decimals))

  let bundle = Bundle.load('1')
  let token0USD = findEthPerToken(poolToken0).times(bundle.ethPrice)
  let token1USD = findEthPerToken(poolToken1).times(bundle.ethPrice)

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toString()
      .concat('-')
      .concat(event.logIndex.toString())
  )

  withdrawal.hash = event.transaction.hash.toString()
  withdrawal.logIndex = event.logIndex.toI32()
  withdrawal.protocol = protocol.id
  withdrawal.to = burn.to.toString()
  withdrawal.from = burn.sender.toString()
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = pool.inputTokens
  withdrawal.outputTokens = pool.outputToken
  withdrawal.inputTokenAmounts = [token0Amount, token1Amount]
  withdrawal.outputTokenAmount = burn.liquidity
  withdrawal.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))


  updateUsageMetrics(event.block.number, event.block.timestamp, withdrawal.from)
  let financialMetrics = updateFinancials(event.block.number, event.block.timestamp, withdrawal.from)
  let poolMetrics = updatePoolMetrics(event.block.number, event.block.timestamp, pool)
  
  burn.save()
  withdrawal.save()
  pool.save()
  financialMetrics.save()
  poolMetrics.save()
}



export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.address.toHexString())
  let pairContract = PairContract.bind(event.address)

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0In = convertTokenToDecimal(event.params.amount0In, BigInt.fromI32(token0.decimals))
  let amount1In = convertTokenToDecimal(event.params.amount1In, BigInt.fromI32(token1.decimals))
  let amount0Out = convertTokenToDecimal(event.params.amount0Out, BigInt.fromI32(token0.decimals))
  let amount1Out = convertTokenToDecimal(event.params.amount1Out, BigInt.fromI32(token1.decimals))

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In)
  let amount1Total = amount1Out.plus(amount1In)

  // ETH/USD prices
  let bundle = Bundle.load('1')

  let token0ETHPrice = findEthPerToken(token0)
  let token1ETHPrice = findEthPerToken(token1)

  let token0USD = token0ETHPrice.times(amount0Total).times(bundle.ethPrice)
  let token1USD = token1ETHPrice.times(amount1Total).times(bundle.ethPrice)

  /// get total amounts of derived USD for tracking
  /// let derivedAmountUSD = token1USD.plus(token0USD).div(BigDecimal.fromString('2'))

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, token0 as Token, amount1Total, token1 as Token, pair as Pair)

  let trackedAmountETH: BigDecimal
  if (bundle.ethPrice.equals(BIGDECIMAL_ZERO)) {
    trackedAmountETH = BIGDECIMAL_ZERO
  } else {
    trackedAmountETH = trackedAmountUSD.div(bundle.ethPrice)
  }

  if (amount0In != BIGDECIMAL_ZERO) {
    var feeToken = amount0In.times(BigDecimal.fromString('0.03'))
    var feeUSD = feeToken.times(token0ETHPrice).times(bundle.ethPrice)
  } else {
    var feeToken = amount1In.times(BigDecimal.fromString('0.03'))
    var feeUSD = feeToken.times(token1ETHPrice).times(bundle.ethPrice)
  }


  let swap = new SwapEvent(
    event.transaction.hash
      .toHexString()
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


  updateFinancials(event.block.number, event.block.timestamp, swap.from)
  updatePoolMetrics(event.block.number, event.block.timestamp, pool)
  updateUsageMetrics(event.block.number, event.block.timestamp, swap.from)
  updateVolumeAndFees(event.block.timestamp, trackedAmountUSD, feeUSD, pool)

  swap.save()
  pool.save()

}