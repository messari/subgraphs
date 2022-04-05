import { Address, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { LiquidityPool, _Account, _DailyActiveAccount } from "../generated/schema";
import { SECONDS_PER_DAY } from "./constants";
import { getOrCreateDexAmm, getOrCreateFinancialSnapshot, getOrCreatePoolSnapshot, getOrCreateUsageSnapshot } from "./getters";

export function updateUsageSnapshot(event: ethereum.Event, from: Address): void {
    let epochDays = getEpochDays(event.block.timestamp)
    let protocol = getOrCreateDexAmm()

    let usageSnapshot = getOrCreateUsageSnapshot(epochDays, protocol.id);
    usageSnapshot.blockNumber = event.block.number;
    usageSnapshot.timestamp = event.block.timestamp;
    usageSnapshot.dailyTransactionCount += 1;
  
    // update totalUniqueUsers
    let accountId = from.toHexString();
    let account = _Account.load(accountId);
    if (!account) {
      account = new _Account(accountId);
      account.save();
      
      usageSnapshot.totalUniqueUsers += 1;

      protocol.totalUniqueUsers = usageSnapshot.totalUniqueUsers;
      protocol.save();
    }
  
    // update dailyActiveUsers
    let dailyActiveAccountId = epochDays.toString() + "-" + from.toHexString();
    let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
    if (!dailyActiveAccount) {
      dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
      dailyActiveAccount.save();

      usageSnapshot.activeUsers += 1;
    }
  
    usageSnapshot.save();
  }

export function updatePoolSnapshot(event: ethereum.Event): void {
    let epochDays = getEpochDays(event.block.timestamp)
    let pool = LiquidityPool.load(event.address.toHexString())
    if (!pool) {
      log.warning("[updatePoolSnapshot] Pool not found: {}", [event.address.toHexString()])
      return
    }
    let protocol = getOrCreateDexAmm()

    let poolSnapshot = getOrCreatePoolSnapshot(epochDays, pool.id, protocol.id)
    poolSnapshot.totalValueLockedUSD = pool.totalValueLockedUSD
    poolSnapshot.totalVolumeUSD = pool.totalVolumeUSD
    poolSnapshot.inputTokenBalances = pool.inputTokenBalances
    poolSnapshot.outputTokenSupply = pool.outputTokenSupply
    poolSnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD
    poolSnapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount
    poolSnapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD
    poolSnapshot.blockNumber = event.block.number
    poolSnapshot.timestamp = event.block.timestamp
    poolSnapshot.save()
}

export function updateFinancialSnapshot(event: ethereum.Event): void {
    let epochDays = getEpochDays(event.block.timestamp)
    let pool = LiquidityPool.load(event.address.toHexString())
    if (!pool) {
      log.warning("[updateFinancialSnapshot] Pool not found: {}", [event.address.toHexString()])
      return
    }
    let protocol = getOrCreateDexAmm()

    let financialSnapshot = getOrCreateFinancialSnapshot(epochDays, protocol.id)
    financialSnapshot.totalValueLockedUSD = pool.totalValueLockedUSD
    // TODO: protocolTreasuryUSD
    // TODO: protocolControlledValueUSD
    financialSnapshot.totalVolumeUSD = pool.totalVolumeUSD
    // TODO: supplySideRevenueUSD
    // TODO: protocolSideRevenueUSD
    // TODO: feesUSD data should be kept tracked of in LiquidityPool, wait for Vincent's response
    financialSnapshot.blockNumber = event.block.number
    financialSnapshot.timestamp = event.block.timestamp
    financialSnapshot.save()

    protocol.totalValueLockedUSD = financialSnapshot.totalValueLockedUSD
    protocol.save()
}

// Number of days since Unix epoch
function getEpochDays(timestamp: BigInt): i64 {
    return timestamp.toI64() / SECONDS_PER_DAY;
}