// import { log } from "@graphprotocol/graph-ts"
import { BigInt, BigDecimal, Address, store, ethereum } from "@graphprotocol/graph-ts"
import {
  _Account,
  _DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  _LiquidityPoolAmounts,
  Token,
  DexAmmProtocol,
  LiquidityPool,
  LiquidityPoolFee,
  Deposit,
  Withdraw,
  Swap as SwapEvent,
} from "../../generated/schema"
import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'
import { Pair as PairTemplate } from '../../generated/templates'
import { BIGDECIMAL_ZERO, INT_ZERO, INT_ONE, FACTORY_ADDRESS, BIGINT_ZERO, DEFAULT_DECIMALS, SECONDS_PER_DAY, TransferType, LiquidityPoolFeeType, PROTOCOL_FEE_TO_OFF, TRADING_FEE_TO_OFF, BIGDECIMAL_HUNDRED } from "../common/constants"
import { findEthPerToken, getEthPriceInUSD, getTrackedVolumeUSD, WHITELIST } from "./Price"
import { getLiquidityPool, getOrCreateDex, getOrCreateEtherHelper, getOrCreateTokenTracker, getLiquidityPoolAmounts, getOrCreateTransfer, savePoolId, getLiquidityPoolFee } from "./getters"
import { updateVolumeAndFees } from "./intervalUpdates"
import { getOrCreateToken } from "./tokens"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ['0x9ea3b5b4ec044b70375236a281986106457b20ef']

function createPoolFees(poolAddressString: string): string[] {
  let poolTradingFee = new LiquidityPoolFee('trading-fee-'+poolAddressString)
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE
  poolTradingFee.feePercentage = TRADING_FEE_TO_OFF

  let poolProtocolFee = new LiquidityPoolFee('protocol-fee-'+poolAddressString)
  poolProtocolFee.feeType = LiquidityPoolFeeType.PROTOCOL_FEE
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_OFF

  poolTradingFee.save()
  poolProtocolFee.save()

  return [poolTradingFee.id, poolProtocolFee.id]
}

// Create a liquidity pool from PairCreated contract call
export function CreateLiquidityPool(event: ethereum.Event, protocol: DexAmmProtocol, poolAddress: Address, token0: Token, token1: Token, LPtoken: Token): void {
  let poolAddressString = poolAddress.toHexString()
  let pool = new LiquidityPool(poolAddressString)
  let poolAmounts = new _LiquidityPoolAmounts(poolAddressString)

  pool.protocol = protocol.id
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = LPtoken.id
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO
  pool.totalVolumeUSD = BIGDECIMAL_ZERO
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO]
  pool.outputTokenSupply = BIGINT_ZERO 
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  pool.fees = createPoolFees(poolAddressString)
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + LPtoken.symbol
  pool.symbol = LPtoken.symbol

  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  savePoolId(poolAddress)

  pool.save()
  poolAmounts.save()

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress.toHexString())
  poolDeposits.valueInt = INT_ZERO
  poolDeposits.save()

  // create the tracked contract based on the template
  PairTemplate.create(poolAddress)
}

// Create Account entity for participating account 
export function createAndIncrementAccount(accountId: Address): i32 {
    let account = _Account.load(accountId.toHexString())
    if (!account) {
        account = new _Account(accountId.toHexString());
        account.save();

        return INT_ONE
    } 
    return INT_ZERO
}

// Create DailyActiveAccount entity for participating account
export function createAndIncrementDailyAccount(event: ethereum.Event, accountId: Address): i32 {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + accountId.toHexString()
    let account = _DailyActiveAccount.load(dailyActiveAccountId)
    if (!account) {
        account = new _DailyActiveAccount(accountId.toHexString());
        account.save();
        
        return INT_ONE
    } 
    return INT_ZERO
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations. 
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

// Upate token balances based on reserves emitted from the sync event. 
export function updateInputTokenBalances(poolAddress: string, reserve0: BigInt, reserve1: BigInt): void {
  
  let pool = getLiquidityPool(poolAddress)
  let poolAmounts = getLiquidityPoolAmounts(poolAddress)

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals)
  let tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals)

  poolAmounts.inputTokenBalances = [tokenDecimal0, tokenDecimal1]
  pool.inputTokenBalances = [reserve0, reserve1]

  poolAmounts.save()
  pool.save()
}

// Update tvl an token prices 
export function updateTvlAndTokenPrices(poolAddress: string): void {
  let pool = getLiquidityPool(poolAddress)

  let protocol = getOrCreateDex()

  // Get updated ETH price now that reserves could have changed
  let ether = getOrCreateEtherHelper()
  ether.valueDecimal = getEthPriceInUSD()

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))

  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)

  let inputToken0 = convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals)
  let inputToken1 = convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals)

  // Get new tvl
  let newTvl = tokenTracker0.derivedETH.times(inputToken0).times(ether.valueDecimal!).plus(tokenTracker1.derivedETH.times(inputToken1).times(ether.valueDecimal!))

  // Add the new pool tvl
  pool.totalValueLockedUSD =  newTvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl)

  let outputTokenSupply = convertTokenToDecimal(pool.outputTokenSupply, DEFAULT_DECIMALS)

  // Update LP token prices
  if (pool.outputTokenSupply == BIGINT_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  else pool.outputTokenPriceUSD = newTvl.div(outputTokenSupply)


  pool.save()
  protocol.save()
  ether.save()
}

// Handle data from transfer event for mints. Used to populate deposit entity in the mint event. 
export function handleTransferMint(event: ethereum.Event, value: BigInt, to: Address): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let transfer = getOrCreateTransfer(event)
  
  // Tracks supply of minted LP tokens 
  pool.outputTokenSupply = pool.outputTokenSupply.plus(value)

  // create new mint if no mints so far or if last one is done already
  if (!transfer.type) {
    transfer.type = TransferType.MINT

    // Address that is minted to
    transfer.sender = to.toHexString()
    transfer.liquidity = value
  }

  // This is done to remove a potential feeto mint --- Not active 
  else if (transfer.type == TransferType.MINT) {
    // Updates the liquidity if the previous mint was a fee mint
    // Address that is minted to
    transfer.sender = to.toHexString()
    transfer.liquidity = value
  }

  transfer.save()
  pool.save()
}

// Handle data from transfer event for burns. Used to populate deposit entity in the burn event. 
export function handleTransferToPoolBurn(event: ethereum.Event, value: BigInt,from: Address): void {
  let transfer = getOrCreateTransfer(event)

  transfer.type = TransferType.BURN
  transfer.sender = from.toHexString()

  transfer.save()
}


// Handle data from transfer event for burns. Used to populate deposit entity in the burn event. 
export function handleTransferBurn(event: ethereum.Event, value: BigInt, from: Address): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let transfer = getOrCreateTransfer(event)

  // Tracks supply of minted LP tokens 
  pool.outputTokenSupply = pool.outputTokenSupply.minus(value)

  // Uses address from the transfer to pool part of the burn. Otherwise create with this transfer event. 
  if (transfer.type == TransferType.BURN) { 
    transfer.liquidity = value
  }
  else {
    transfer.type = TransferType.BURN
    transfer.sender = from.toHexString()
    transfer.liquidity = value
  }

  transfer.save()
  pool.save()
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt, sender: Address): void {
  let transfer = getOrCreateTransfer(event)

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
  deposit.to = pool.id
  deposit.from = transfer.sender!
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  deposit.outputToken = pool.outputToken
  deposit.inputTokenAmounts = [amount0, amount1]
  deposit.outputTokenAmount = transfer.liquidity!
  deposit.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))

  UpdateDepositHelper(event.address)

  store.remove('_Transfer', transfer.id)

  deposit.save()
}

// Generate the withdraw entity
export function createWithdraw(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
  let transfer = getOrCreateTransfer(event)

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
  withdrawal.to = transfer.sender!
  withdrawal.from = pool.id
  withdrawal.blockNumber = event.block.number
  withdrawal.timestamp = event.block.timestamp
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]]
  withdrawal.outputToken = pool.outputToken
  withdrawal.inputTokenAmounts = [amount0, amount1]
  withdrawal.outputTokenAmount = transfer.liquidity!
  withdrawal.amountUSD = token0USD.times(token0Amount).plus(token1USD.times(token1Amount))

  store.remove('_Transfer', transfer.id)

  withdrawal.save()
}

function percToDec(percentage: BigDecimal): BigDecimal {
  return percentage.div(BIGDECIMAL_HUNDRED)
}

// Handle swaps data and update entities volumes and fees 
export function createSwapHandleVolumeAndFees(event: ethereum.Event, to: Address, sender: Address, amount0In: BigInt, amount1In: BigInt, amount0Out: BigInt, amount1Out: BigInt): void {
  
  let protocol = getOrCreateDex()
  let pool = getLiquidityPool(event.address.toHexString())
  let poolAmounts = getLiquidityPoolAmounts(event.address.toHexString())

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]))
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]))
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In)
  let amount1Total = amount1Out.plus(amount1In)

  let amount0TotalConverted = convertTokenToDecimal(amount0Total, token0.decimals)
  let amount1TotalConverted = convertTokenToDecimal(amount1Total, token1.decimals)

  // ETH/USD prices
  let ether = getOrCreateEtherHelper()

  let token0USD = tokenTracker0.derivedETH.times(amount0TotalConverted).times(ether.valueDecimal!)
  let token1USD = tokenTracker1.derivedETH.times(amount1TotalConverted).times(ether.valueDecimal!)

  // /// get total amounts of derived USD for tracking
  // let derivedAmountUSD = token1USD.plus(token0USD).div(BIGDECIMAL_TWO)

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(amount0TotalConverted, tokenTracker0 as _TokenTracker, amount1TotalConverted, tokenTracker1 as _TokenTracker, poolAmounts as _LiquidityPoolAmounts)

  let tradingFee = getLiquidityPoolFee(pool.fees[0])
  let protocolFee = getLiquidityPoolFee(pool.fees[1])

  let tradingFeeAmountUSD: BigDecimal
  let protocolFeeAmountUSD: BigDecimal

  if (amount0In != BIGINT_ZERO) {
    let tradingFeeAmount = amount0TotalConverted.times(percToDec(tradingFee.feePercentage))
    let protocolFeeAmount = amount0TotalConverted.times(percToDec(protocolFee.feePercentage))
    tradingFeeAmountUSD = tradingFeeAmount.times(tokenTracker0.derivedETH).times(ether.valueDecimal!)
    protocolFeeAmountUSD = protocolFeeAmount.times(tokenTracker0.derivedETH).times(ether.valueDecimal!)
  } else {
    let tradingFeeAmount = amount1TotalConverted.times(percToDec(tradingFee.feePercentage))
    let protocolFeeAmount = amount1TotalConverted.times(percToDec(protocolFee.feePercentage))
    tradingFeeAmountUSD = tradingFeeAmount.times(tokenTracker1.derivedETH).times(ether.valueDecimal!)
    protocolFeeAmountUSD = protocolFeeAmount.times(tokenTracker1.derivedETH).times(ether.valueDecimal!)
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
  swap.tokenIn = amount0In != BIGINT_ZERO ? token0.id : token1.id
  swap.amountIn = amount0In != BIGINT_ZERO ? amount0Total : amount1Total
  swap.amountInUSD = amount0In != BIGINT_ZERO ? token0USD : token1USD
  swap.tokenOut = amount0Out != BIGINT_ZERO ? token0.id : token1.id
  swap.amountOut = amount0Out != BIGINT_ZERO ? amount0Total : amount1Total
  swap.amountOutUSD = amount0Out != BIGINT_ZERO ? token0USD : token1USD
  swap.pool = pool.id

  swap.save()

  updateVolumeAndFees(event, trackedAmountUSD, tradingFeeAmountUSD, protocolFeeAmountUSD)
}

// Update store that tracks the deposit count per pool
function UpdateDepositHelper(poolAddress: Address): void {
  let poolDeposits = _HelperStore.load(poolAddress.toHexString())!
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE
  poolDeposits.save()
}

// convert decimals 
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

// convert emitted values to tokens count
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