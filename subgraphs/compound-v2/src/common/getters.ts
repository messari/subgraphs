// get or create snapshots and metrics

import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  MarketDailySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
} from "../types/schema";
import { CToken } from "../types/Comptroller/cToken";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  COMPTROLLER_ADDRESS,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  LENDING_TYPE,
  NETWORK_ETHEREUM,
  PROTOCOL_NAME,
  PROTOCOL_RISK_TYPE,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
  REWARD_TOKEN_TYPE,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SUBGRAPH_VERSION,
} from "./utils/constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = COMPTROLLER_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketAddress = event.address.toHexString(); // TODO: might not be able to do this
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = COMPTROLLER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalances = [];
    marketMetrics.inputTokenPricesUSD = [];
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [];
    marketMetrics.rewardTokenEmissionsUSD = [];
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.depositRate = BIGDECIMAL_ZERO;
    marketMetrics.stableBorrowRate = BIGDECIMAL_ZERO;
    marketMetrics.variableBorrowRate = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = COMPTROLLER_ADDRESS;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
////////////////////////////

export function getOrCreateLendingProtcol(): LendingProtocol {
  let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(COMPTROLLER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = SCHEMA_VERSION;
    protocol.subgraphVersion = SUBGRAPH_VERSION;
    protocol.network = NETWORK_ETHEREUM;
    protocol.type = PROTOCOL_TYPE;
    protocol.totalUniqueUsers = 0 as i32;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.lendingType = LENDING_TYPE;
    protocol.riskType = PROTOCOL_RISK_TYPE;

    protocol.save();
  }
  return protocol;
}

export function getOrCreateCToken(tokenAddress: Address, cTokenContract: CToken): Token {
  let cToken = Token.load(tokenAddress.toHexString());

  if (cToken == null) {
    cToken = new Token(tokenAddress.toHexString());
    cToken.name = cTokenContract.name();
    cToken.symbol = cTokenContract.symbol();
    cToken.decimals = cTokenContract.decimals();
    cToken.save();
  }
  return cToken;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (token == null) {
    token = new Token(tokenAddress.toHexString());

    // check for ETH token - unique
    if (tokenAddress.toHexString() == ETH_ADDRESS) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.name = getAssetName(tokenAddress);
      token.symbol = getAssetSymbol(tokenAddress);
      token.decimals = getAssetDecimals(tokenAddress);
    }
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(tokenAddress: Address): RewardToken {
  let rewardToken = RewardToken.load(tokenAddress.toHexString());
  if (rewardToken == null) {
    rewardToken = new RewardToken(tokenAddress.toHexString());
    rewardToken.name = getAssetName(tokenAddress);
    rewardToken.symbol = getAssetSymbol(tokenAddress);
    rewardToken.decimals = getAssetDecimals(tokenAddress);
    rewardToken.type = REWARD_TOKEN_TYPE;
    rewardToken.save();
  }
  return rewardToken;
}
