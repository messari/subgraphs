import {
  BigDecimal,
  Address,
  ethereum,
  BigInt,
  log
} from "@graphprotocol/graph-ts";

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
  ZERO_BD,
  ONE_BI,
  STABLE_COINS
} from "./constants";

import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getUSDprice,
  setUSDprice
} from "./getters";

import { ERC20 } from "../../generated/ERC20/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";

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

  let protocol = getOrCreateDexAmm(event.address);

  // let token1 = ERC20.bind(tokenAdds[0]);
  // let token2 = ERC20.bind(tokenAdds[1]);
  // let lpToken = ERC20.bind(pool.outputToken);
  //
  // let poolInstance = DVM.bind(poolAdd);
  //
  // let tokenBal1 = token1.try_balanceOf(poolAdd);
  // let tokenBal2 = token2.try_balanceOf(poolAdd);
  // let lpSupply = poolInstance.totalSupply();
  //
  // let tokenPoolBals: BigInt[] = [tokenBal1, tokenBal2];
  //
  // let totalUSDvalTransaction = ZERO_BD;
  let totalUSDvalPool = ZERO_BD;

  log.info("this is the transaction hash: {} ", [
    event.transaction.hash.toHexString()
  ]);
  //check to see if either token in the transaction is a stablecoin(DAI, USDC, USDT)
  //If either tokens are call the setUSDprice function to set a price for the other token
  if (
    tokenAdds[0] == Address.fromString(STABLE_COINS[0]) ||
    tokenAdds[0] == Address.fromString(STABLE_COINS[1]) ||
    tokenAdds[0] == Address.fromString(STABLE_COINS[2])
  ) {
    setUSDprice(tokenAdds[1], amount[1], tokenAdds[0], amount[0]);
  }

  if (
    tokenAdds[1] == Address.fromString(STABLE_COINS[0]) ||
    tokenAdds[1] == Address.fromString(STABLE_COINS[1]) ||
    tokenAdds[1] == Address.fromString(STABLE_COINS[2])
  ) {
    setUSDprice(tokenAdds[0], amount[0], tokenAdds[1], amount[1]);
  }

  for (let i = 0; i < tokenAdds.length; i++) {
    let usdValueOfTransaction = getUSDprice(tokenAdds[i], trader, amount[i]);
    log.info("this is the USD value returned: {} ", [
      usdValueOfTransaction.toString()
    ]);
  }

  // let lpTokenUSD = getTokenAmountPriceAv(poolAdd, trader, 1000000000000000000);

  //poolMetrics.totalValueLockedUSD = totalUSDvalPool;
  // // poolMetrics.totalVolumeUSD = pool.totalVolumeUSD;
  // poolMetrics.inputTokenBalances = tokenPoolBals;
  // poolMetrics.outputTokenSupply = lpSupply;
  // poolMetrics.outputTokenPriceUSD = lpTokenUSD;
  // poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  // poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.save();
  pool.save();
}

function getTokenPriceUSD(tokenAddress: Address): BigDecimal {}
