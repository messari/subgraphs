import {
  Conversion
} from "../generated/BancorNetwork/BancorNetwork"
import {
  LiquidityPoolAdded,
  LiquidityPoolRemoved,
} from "../generated/ConverterRegistry/ConverterRegistry"
import {
  ConversionFeeUpdate,
  LiquidityAdded,
  LiquidityRemoved,
} from "../generated/templates/StandardPoolConverter/StandardPoolConverter"
import { Token, LiquidityPool, Swap, Deposit, _LiquidityEventMatcher, LiquidityPoolFee } from "../generated/schema"
import { getOrCreateDexAmm, getOrCreateToken } from "./getters"
import { getTKNPriceUSD, getReserveTokens, getBNTPriceUSD, isBNT, createPoolFees } from "./utils"
import { BIGINT_ZERO, BNT_ADDRESS } from "./constants"
import { BigInt, log } from "@graphprotocol/graph-ts"
import { updateFinancialSnapshot, updatePoolSnapshot, updateUsageSnapshot } from "./metrics"

// we assume one side of the pool is always BNT, see https://t.me/BancorDevelopers/31241
export function handleConversion(event: Conversion): void {
  let protocol = getOrCreateDexAmm()
  let pool = LiquidityPool.load(event.params._smartToken.toHexString())
  if (!pool) {
    // TODO: understand why it happens
    // https://t.me/BancorDevelopers/31362
    log.warning("[handleConversion] Pool not found: {}", [event.params._smartToken.toHexString()])
    return
  }
  let tokenIn = getOrCreateToken(event.params._fromToken)
  let tokenOut = getOrCreateToken(event.params._toToken)

  let swap = new Swap(event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(event.logIndex.toString()))
  swap.hash = event.transaction.hash.toHexString()
  swap.logIndex = event.logIndex.toI32()
  swap.protocol = protocol.id
  swap.to = event.params._trader.toHexString()
  swap.from = pool.id
  swap.blockNumber = event.block.number
  swap.timestamp = event.block.timestamp
  swap.tokenIn = tokenIn.id
  swap.tokenOut = tokenOut.id
  swap.amountIn = event.params._fromAmount
  swap.amountOut = event.params._toAmount
  swap.amountInUSD = event.params._fromAmount.toBigDecimal().times(getTKNPriceUSD(pool.id))
  swap.amountOutUSD = event.params._toAmount.toBigDecimal().times(getTKNPriceUSD(pool.id))
  swap.pool = pool.id
  swap.save()

  // update pool
  let protocolDelta: BigInt, userDelta: BigInt
  if (isBNT(tokenIn)) {
    userDelta = event.params._toAmount
    protocolDelta = BIGINT_ZERO.minus(event.params._fromAmount)
  } else {
    userDelta = BIGINT_ZERO.minus(event.params._fromAmount)
    protocolDelta = event.params._toAmount 
  }
  // TODO: maybe reuse the code?
  pool.inputTokenBalances[0] = pool.inputTokenBalances[0].plus(protocolDelta)
  pool.inputTokenBalances[1] = pool.inputTokenBalances[1].plus(userDelta)
  // Bancor v2 doesn't grant liquidity providers with LP tokens to track ownership
  // Therefore we won't update pool.outputTokenSupply
  pool.outputTokenPriceUSD = getBNTPriceUSD()
  // TODO: rewardTokenEmissionsAmount
  // TODO: rewardTokenEmissionsUSD

  updateUsageSnapshot(event, event.params._trader)
  updatePoolSnapshot(event)
  updateFinancialSnapshot(event)
}

// Removing liquidity pool is not possible through the UI and it's an ultra extreme edge case
// Therefore decide to only handle the "added" case here
export function handleLiquidityPoolAdded(event: LiquidityPoolAdded): void {
  let protocol = getOrCreateDexAmm()
  let reserveTokens = getReserveTokens(event.params._liquidityPool)
  if (reserveTokens.length != 2) {
    log.warning("Number of reserve tokens not eq 2", [])
    return
  }
  // It is guaranteed that reserveTokens.length == 2
  // For simplicity, let's make sure token0 is always BNT
  let token0: Token, token1: Token
  if (isBNT(reserveTokens[0])) {
    token0 = reserveTokens[0]
    token1 = reserveTokens[1]
  } else {
    token0 = reserveTokens[1]
    token1 = reserveTokens[0]
  }
  let lpToken = getOrCreateToken(event.params._liquidityPool)

  let pool = new LiquidityPool(event.params._liquidityPool.toHexString())
  pool.protocol = protocol.id
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = lpToken.id
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO]
  pool.fees = createPoolFees(pool.id)
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + lpToken.symbol
  pool.symbol = lpToken.symbol
  pool.save()

  updateUsageSnapshot(event, event.transaction.from)
  updatePoolSnapshot(event)
  updateFinancialSnapshot(event)
}

// https://t.me/BancorDevelopers/31150
// Q: Is there a way to somehow "join" the 2 events together
//    so that I could tell how this deposit affect the BNT-TKN pool?
// A: Unfortunately there’s no way to do that with 100% accuracy.
//    You can rely on tx hash but 1 tx can involve multiple liquidity provisioning.
//    You can get to an almost perfect heuristics though
export function handleLiquidityAdded(event: LiquidityAdded): void {
  // Use _LiquidityEventMatcher to join 2 events together
  let matcher = _LiquidityEventMatcher.load(event.transaction.hash.toHexString())
  if (!matcher) {
    matcher = new _LiquidityEventMatcher(event.transaction.hash.toHexString())
    matcher.reserveToken = event.params._reserveToken.toHexString()
    matcher.amount = event.params._amount
    matcher.newBalance = event.params._newBalance
    matcher.newSupply = event.params._newSupply
    matcher.save()
    return
  }

  let userDeposit: BigInt, protocolDeposit: BigInt
  if (matcher.reserveToken == BNT_ADDRESS) {
    userDeposit = event.params._amount
    protocolDeposit = matcher.amount
  } else {
    userDeposit = matcher.amount
    protocolDeposit = event.params._amount
  }

  let protocol = getOrCreateDexAmm()
  let pool = LiquidityPool.load(event.address.toHexString())
  if (!pool) {
    log.warning("[handleLiquidityAdded] Pool not found: {}", [event.address.toHexString()])
    return
  }

  let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = pool.id;
  deposit.from = event.params._provider.toHexString();
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = pool.inputTokens
  deposit.outputToken = pool.outputToken
  // make sure BNT go first
  deposit.inputTokenAmounts = [protocolDeposit, userDeposit]
  // only user deposits are counted.
  deposit.amountUSD = userDeposit.toBigDecimal().times(getTKNPriceUSD(pool.id))
  // Bancor v2 doesn't grant liquidity providers with LP tokens to track ownership
  // Therefore we won't update deposit.outputTokenAmount
  deposit.pool = pool.id
  deposit.save();

  pool.inputTokenBalances[0] = pool.inputTokenBalances[0].plus(protocolDeposit)
  pool.inputTokenBalances[1] = pool.inputTokenBalances[1].plus(userDeposit)
  // Bancor v2 doesn't grant liquidity providers with LP tokens to track ownership
  // Therefore we won't update pool.outputTokenSupply
  pool.outputTokenPriceUSD = getBNTPriceUSD()
  // TODO: rewardTokenEmissionsAmount
  // TODO: rewardTokenEmissionsUSD

  updateUsageSnapshot(event, event.transaction.from)
  updatePoolSnapshot(event)
  updateFinancialSnapshot(event)
}

// TODO: should be very similar to handleLiquidityAdded
export function handleLiquidityRemoved(event: LiquidityRemoved): void {
}

export function handleConversionFeeUpdate(event: ConversionFeeUpdate): void {
  let pool = LiquidityPool.load(event.transaction.to!.toHexString())
  if (!pool) {
    log.warning("[handleConversionFeeUpdate] Pool not found: {}", [event.transaction.to!.toHexString()])
    return
  }
  let fee = LiquidityPoolFee.load(pool.fees[0])
  if (!fee) {
    log.warning("[handleConversionFeeUpdate] Fee not found: {}", [pool.fees[0]])
    return
  }
  fee.feePercentage = event.params._newFee.toBigDecimal()
  fee.save()
}