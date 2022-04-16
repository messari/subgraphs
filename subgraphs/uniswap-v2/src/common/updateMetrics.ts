import { log, Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { Account, DailyActiveAccount, UsageMetricsDailySnapshot, _HelperStore, _TokenTracker } from "../../generated/schema"
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateDex, getOrCreateEtherHelper, getOrCreateFinancials, getOrCreatePoolDailySnapshot, getOrCreateToken, getOrCreateTokenTracker, getOrCreateUsersHelper } from "./getters"
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, FACTORY_ADDRESS, INT_ONE, SECONDS_PER_DAY, WHITELIST } from "./constants"
import { convertTokenToDecimal } from "./utils/utils"
import { getUsdPricePerToken } from "../Prices"
import { getPriceUsdc } from "../Prices/routers/UniswapRouter"

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {

  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateDex()
  
  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD

  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY
  let id = Bytes.fromI32(dayID)
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  let totalUniqueUsers = getOrCreateUsersHelper()
  let protocol = getOrCreateDex()

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = FACTORY_ADDRESS
    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }
  
  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let account = Account.load(from)
  if (!account) {
    account = new Account(from);
    account.save();
    totalUniqueUsers.valueInt += 1;
  }
  usageMetrics.totalUniqueUsers = totalUniqueUsers.valueInt;
  protocol.totalUniqueUsers = totalUniqueUsers.valueInt;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.concat(from)
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1
  }

  totalUniqueUsers.save();
  usageMetrics.save();
  protocol.save()
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {

  // get or create pool metrics
  let poolMetrics = getOrCreatePoolDailySnapshot(event)
  let pool = getLiquidityPool(event.address)
    
  // Update the block number and timestamp to that of the last transaction of that day
  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances
  poolMetrics.outputTokenSupply = pool.outputTokenSupply
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.save();
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations. 
export function updateTokenWhitelists(tokenTracker0: _TokenTracker, tokenTracker1: _TokenTracker, poolAddress: Address): void {
    // update white listed pools
    if (WHITELIST.includes(tokenTracker0.id)) {
      let newPools = tokenTracker1.whitelistPools
      newPools.push(poolAddress)
      tokenTracker1.whitelistPools = newPools
      tokenTracker1.save()
    }
  
    if (WHITELIST.includes(tokenTracker1.id)) {
      let newPools = tokenTracker0.whitelistPools
      newPools.push(poolAddress)
      tokenTracker0.whitelistPools = newPools
      tokenTracker0.save()
    }
}

// Upate token balances based on reserves emitted from the sync event. 
export function updateInputTokenBalances(poolAddress: Address, reserve0: BigInt, reserve1: BigInt): void {
  
  let pool = getLiquidityPool(poolAddress)
  let poolAmounts = getLiquidityPoolAmounts(poolAddress)

  let token0 = getOrCreateToken(pool.inputTokens[0])
  let token1 = getOrCreateToken(pool.inputTokens[1])

  let tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals)
  let tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals)

  poolAmounts.inputTokenBalances = [tokenDecimal0, tokenDecimal1]
  pool.inputTokenBalances = [reserve0, reserve1]

  poolAmounts.save()
  pool.save()
}

// Update tvl an token prices 
export function updateTvlAndTokenPrices(poolAddress: Address): void {
  let pool = getLiquidityPool(poolAddress)

  let protocol = getOrCreateDex()

  let token0 = getOrCreateToken(pool.inputTokens[0])
  let token1 = getOrCreateToken(pool.inputTokens[1])

  let tokenTracker0 = getOrCreateTokenTracker(pool.inputTokens[0])
  let tokenTracker1 = getOrCreateTokenTracker(pool.inputTokens[1])

  // Using function getUsdPricePerToken(tokenAddr: Address)
  let fetchPrice0 = getPriceUsdc(Address.fromBytes(token0.id), protocol.network)
  if (!fetchPrice0.reverted) {
    tokenTracker0.derivedUSD = fetchPrice0.usdPrice.div(
      fetchPrice0.decimals.toBigDecimal()
    );
  } else {
    // default value of this variable, if reverted is BigDecimal Zero
    tokenTracker0.derivedUSD = fetchPrice0.usdPrice
  }

  let fetchPrice1 = getPriceUsdc(Address.fromBytes(token0.id), protocol.network)
  if (!fetchPrice1.reverted) {
    tokenTracker1.derivedUSD = fetchPrice1.usdPrice.div(
      fetchPrice1.decimals.toBigDecimal()
    );
  } else {
    // default value of this variable, if reverted is BigDecimal Zero
    tokenTracker1.derivedUSD = fetchPrice1.usdPrice
  }

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD)

  let inputToken0 = convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals)
  let inputToken1 = convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals)

  // Get new tvl
  let newTvl = tokenTracker0.derivedUSD.times(inputToken0).plus(tokenTracker1.derivedUSD.times(inputToken1))

  // Add the new pool tvl
  pool.totalValueLockedUSD =  newTvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl)

  let outputTokenSupply = convertTokenToDecimal(pool.outputTokenSupply!, DEFAULT_DECIMALS)

  // Update LP token prices
  if (pool.outputTokenSupply == BIGINT_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  else pool.outputTokenPriceUSD = newTvl.div(outputTokenSupply)


  pool.save()
  protocol.save()
}

// Update the volume and accrued fees for all relavant entities 
export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, tradingFeeAmountUSD: BigDecimal, protocolFeeAmountUSD: BigDecimal): void {
    let pool = getLiquidityPool(event.address)
    let protocol = getOrCreateDex()
    let poolMetrics = getOrCreatePoolDailySnapshot(event);
    let financialMetrics = getOrCreateFinancials(event);
  
    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(tradingFeeAmountUSD).plus(protocolFeeAmountUSD)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(tradingFeeAmountUSD)
    financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(protocolFeeAmountUSD)

    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)
    protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(trackedAmountUSD)
  
    financialMetrics.save()
    poolMetrics.save();
    protocol.save()
    pool.save()
}

// Update store that tracks the deposit count per pool
export function updateDepositHelper(poolAddress: Address): void {
    let poolDeposits = _HelperStore.load(poolAddress)!
    poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE
    poolDeposits.save()
}