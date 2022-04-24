import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  PROTOCOL_ADDRESS,
  SECONDS_PER_DAY,
} from "../common/constants";


export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

export function getOrCreateToken(tokenAddress: Address, underlyingAsset: string = ''): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.underlyingAsset = underlyingAsset;

    token.save();
  }
  return token;
}

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = PROTOCOL_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}
