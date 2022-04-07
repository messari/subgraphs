import { BigDecimal, Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  _Account,
  _DailyActiveAccount,
  UsageMetricsDailySnapshot,
  LiquidityPool
} from "../../generated/schema";

import {
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  SECONDS_PER_DAY,
  ADDRESS_ZERO,
  ONE_BI
} from "./constants";

import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getTokenAmountPriceAv
} from "./getters";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateDexAmm(event.address);

  // financialMetrics.totalValueLockedUSD = usdPriceOfToken;
  // financialMetrics.protocolTreasuryUSD = protocol.protocolTreasuryUSD;
  // financialMetrics.protocolControlledValueUSD =
  //   protocol.protocolControlledValueUSD;
  // financialMetrics.totalVolumeUSD = protocol.totalVolumeUSD;
  // financialMetrics.supplySideRevenueUSD = protocol.supplySideRevenueUSD;
  // financialMetrics.protocolSideRevenueUSD = protocol.protocolSideRevenueUSD;
  // financialMetrics.feesUSD = protocol.feesUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateDexAmm(event.address);
  if (!account) {
    account = new _Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(
  event: ethereum.Event,
  poolAdd: Address,
  tokenAdds: Address[],
  trader: Address,
  amount: BigInt[]
): void {
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);

  let totalUSDval = 0;

  for (let i = 0; i <= 1; i++) {
    let usdValueOfTransaction = getTokenAmountPriceAv(
      tokenAdds[i],
      trader,
      amount[i]
    );
    // totalUSDval = totalUSDval + usdValueOfTransaction;
  }

  // let protocol = getOrCreateDexAmm(event.address);
  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  // poolMetrics.totalVolumeUSD = pool.totalVolumeUSD;
  // poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  // poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  // poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  // poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  // poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.save();
  pool.save();
}

function getTokenPriceUSD(tokenAddress: Address): BigDecimal {}
