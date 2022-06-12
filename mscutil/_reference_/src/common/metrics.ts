import { BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount, UsageMetricsDailySnapshot } from "../../generated/schema";
import { FACTORY_ADDRESS, SECONDS_PER_DAY } from "./utils/constants";
import { getOrCreateDexAmm, getOrCreatePoolDailySnapshot, getOrCreateUsageMetricSnapshot } from "./getters";

// These are meant more as boilerplates that'll be filled out depending on the
// subgraph, and will be different from subgraph to subgraph, hence left
// partially implemented and commented out.
// They are common within a subgraph but not common across different subgraphs.

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  // let financialMetrics = getOrCreateFinancials(event);
  // let protocol = getOrCreateDexAmm();
  // // Update the block number and timestamp to that of the last transaction of that day
  // financialMetrics.blockNumber = event.block.number;
  // financialMetrics.timestamp = event.block.timestamp;
  // financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  // ...
  // financialMetrics.save();
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
  let account = Account.load(accountId);
  let protocol = getOrCreateDexAmm();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  // let poolMetrics = getOrCreatePoolDailySnapshot(event);
  // let pool = getLiquidityPool(event.address.toHexString());
  // // Update the block number and timestamp to that of the last transaction of that day
  // poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  // poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  // poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  // poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  // poolMetrics.blockNumber = event.block.number;
  // poolMetrics.timestamp = event.block.timestamp;
  // ...
  // poolMetrics.save();
}
