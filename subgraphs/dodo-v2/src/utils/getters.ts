// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  RewardToken
} from "../../generated/schema";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

import { ZERO_BD, Network, ProtocolType, RewardTokenType } from "./constants";

export function getOrCreateRewardToken(rewardToken: Address): RewardToken {
  let token = RewardToken.load(rewardToken.toHexString());
  // fetch info if null
  if (!token) {
    token = new RewardToken(rewardToken.toHexString());
    token.symbol = fetchTokenSymbol(rewardToken);
    token.name = fetchTokenName(rewardToken);
    token.decimals = fetchTokenDecimals(rewardToken);
    token.type = RewardTokenType.DEPOSIT;
    token.save();
  }
  return token;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

// export function getOrCreateDexAmm(): DexAmmProtocol {
//   let protocol = DexAmmProtocol.load(FACTORY_ADDRESS);
//
//   if (!protocol) {
//     protocol = new DexAmmProtocol(FACTORY_ADDRESS);
//     protocol.name = "Uniswap v2";
//     protocol.slug = "uniswap-v2";
//     protocol.schemaVersion = "1.0.0";
//     protocol.subgraphVersion = "1.0.0";
//     protocol.network = Network.ETHEREUM;
//     protocol.type = ProtocolType.EXCHANGE;
//     protocol.totalUniqueUsers = 0;
//     protocol.totalValueLockedUSD = ZERO_BD;
//
//     protocol.save();
//   }
//   return protocol;
// }
// export function getOrCreateUsageMetricSnapshot(
//   event: ethereum.Event
// ): UsageMetricsDailySnapshot {
//   // Number of days since Unix epoch
//   let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
//
//   // Create unique id for the day
//   let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
//
//   if (!usageMetrics) {
//     usageMetrics = new UsageMetricsDailySnapshot(id.toString());
//     usageMetrics.protocol = FACTORY_ADDRESS;
//
//     usageMetrics.activeUsers = 0;
//     usageMetrics.totalUniqueUsers = 0;
//     usageMetrics.dailyTransactionCount = 0;
//     usageMetrics.save();
//   }
//
//   return usageMetrics;
// }
//
// export function getOrCreatePoolDailySnapshot(
//   event: ethereum.Event
// ): PoolDailySnapshot {
//   let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
//   let poolAddress = event.address.toHexString();
//   let poolMetrics = PoolDailySnapshot.load(
//     poolAddress.concat("-").concat(id.toString())
//   );
//
//   if (!poolMetrics) {
//     poolMetrics = new PoolDailySnapshot(
//       poolAddress.concat("-").concat(id.toString())
//     );
//     poolMetrics.protocol = FACTORY_ADDRESS;
//     poolMetrics.pool = poolAddress;
//     poolMetrics.rewardTokenEmissionsAmount = [];
//     poolMetrics.rewardTokenEmissionsUSD = [];
//
//     poolMetrics.save();
//   }
//
//   return poolMetrics;
// }
//
// export function getOrCreateFinancials(
//   event: ethereum.Event
// ): FinancialsDailySnapshot {
//   // Number of days since Unix epoch
//   let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
//
//   let financialMetrics = FinancialsDailySnapshot.load(id.toString());
//
//   if (!financialMetrics) {
//     financialMetrics = new FinancialsDailySnapshot(id.toString());
//     financialMetrics.protocol = FACTORY_ADDRESS;
//
//     financialMetrics.feesUSD = BIGDECIMAL_ZERO;
//     financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
//     financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
//     financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
//     financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
//
//     financialMetrics.save();
//   }
//   return financialMetrics;
// }
