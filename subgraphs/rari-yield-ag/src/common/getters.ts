// // get or create snapshots and metrics
import {
  FinancialsDailySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  YieldAggregator,
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  InterestRateSide,
  InterestRateType,
  INT_ZERO,
  METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_NETWORK,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
  RARI_DEPLOYER,
  RARI_YIELD_POOL_TOKEN,
  RewardTokenType,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
  YIELD_VAULT_NAME,
  YIELD_VAULT_SYMBOL,
  ZERO_ADDRESS,
} from "./utils/constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { exponentToBigDecimal } from "./utils/utils";

//   ///////////////////
//   //// Snapshots ////
//   ///////////////////

export function getOrCreateUsageDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = RARI_DEPLOYER;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hour.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hour.toString());
    usageMetrics.protocol = RARI_DEPLOYER;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

//   export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
//     let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
//     let marketAddress = event.address.toHexString();
//     let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

//     if (!marketMetrics) {
//       marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
//       marketMetrics.protocol = COMPTROLLER_ADDRESS;
//       marketMetrics.market = marketAddress;
//       marketMetrics.blockNumber = event.block.timestamp;
//       marketMetrics.timestamp = event.block.timestamp;
//       marketMetrics.rates = [];
//       marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
//       marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
//       marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
//       marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
//       marketMetrics.inputTokenBalance = BIGINT_ZERO;
//       marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.outputTokenSupply = BIGINT_ZERO;
//       marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
//       marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
//       marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

//       marketMetrics.save();
//     }

//     return marketMetrics;
//   }

//   export function getOrCreateMarketHourlySnapshot(event: ethereum.Event): MarketHourlySnapshot {
//     let hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
//     let marketAddress = event.address.toHexString();
//     let id = marketAddress + "-" + hour.toString();
//     let marketMetrics = MarketHourlySnapshot.load(id);

//     if (!marketMetrics) {
//       marketMetrics = new MarketHourlySnapshot(id);
//       marketMetrics.protocol = COMPTROLLER_ADDRESS;
//       marketMetrics.market = marketAddress;
//       marketMetrics.blockNumber = event.block.timestamp;
//       marketMetrics.timestamp = event.block.timestamp;
//       marketMetrics.rates = [];
//       marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
//       marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
//       marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
//       marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
//       marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
//       marketMetrics.inputTokenBalance = BIGINT_ZERO;
//       marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.outputTokenSupply = BIGINT_ZERO;
//       marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
//       marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
//       marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
//       marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

//       marketMetrics.save();
//     }

//     return marketMetrics;
//   }

//   export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
//     // Number of days since Unix epoch
//     let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

//     let financialMetrics = FinancialsDailySnapshot.load(id.toString());

//     if (!financialMetrics) {
//       financialMetrics = new FinancialsDailySnapshot(id.toString());
//       financialMetrics.protocol = COMPTROLLER_ADDRESS;
//       financialMetrics.blockNumber = event.block.number;
//       financialMetrics.timestamp = event.block.timestamp;
//       financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
//       financialMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
//       financialMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
//       financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
//       financialMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;

//       financialMetrics.save();
//     }
//     return financialMetrics;
//   }

/////////////////////////////////////
///// Yield Aggregator Specific /////
/////////////////////////////////////

export function getOrCreateYieldAggregator(): YieldAggregator {
  let protocol = YieldAggregator.load(RARI_DEPLOYER);

  if (!protocol) {
    protocol = new YieldAggregator(RARI_DEPLOYER);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = SCHEMA_VERSION;
    protocol.subgraphVersion = SUBGRAPH_VERSION;
    protocol.methodologyVersion = METHODOLOGY_VERSION;
    protocol.network = PROTOCOL_NETWORK;
    protocol.type = PROTOCOL_TYPE;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;

    protocol.save();
  }
  return protocol;
}

export function getOrCreateVault(event: ethereum.Event, vaultAddress: string): Vault {
  let vault = Vault.load(vaultAddress);

  if (!vault) {
    vault = new Vault(vaultAddress);
    vault.protocol = RARI_DEPLOYER;
    vault.name = YIELD_VAULT_NAME;
    vault.symbol = YIELD_VAULT_SYMBOL;
    //   vault.inputToken = TODO
    let poolToken = getOrCreateToken(RARI_YIELD_POOL_TOKEN);
    vault.outputToken = poolToken.id;
    vault.depositLimit = BIGINT_ZERO;
    //   vault.fees = TODO
    vault.createdTimestamp = event.block.timestamp;
    vault.createdBlockNumber = event.block.number;
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;

    vault.save();
  }
  return vault;
}

//   export function getOrCreateCToken(tokenAddress: Address, cTokenContract: CTokenNew): Token {
//     let cToken = Token.load(tokenAddress.toHexString());

//     if (cToken == null) {
//       cToken = new Token(tokenAddress.toHexString());
//       cToken.name = cTokenContract.name();
//       cToken.symbol = cTokenContract.symbol();
//       cToken.decimals = cTokenContract.decimals();
//       cToken.save();
//     }
//     return cToken;
//   }

export function getOrCreateToken(tokenAddress: string): Token {
  let token = Token.load(tokenAddress);

  if (token == null) {
    token = new Token(tokenAddress);

    // check for ETH token - unique
    if (tokenAddress == ETH_ADDRESS) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.name = getAssetName(Address.fromString(tokenAddress));
      token.symbol = getAssetSymbol(Address.fromString(tokenAddress));
      token.decimals = getAssetDecimals(Address.fromString(tokenAddress));
    }

    token.save();
  }
  return token;
}

//   export function getOrCreateRewardToken(type: string): RewardToken {
//     let id = type + "-" + COMP_ADDRESS;
//     let rewardToken = RewardToken.load(id);
//     if (rewardToken == null) {
//       rewardToken = new RewardToken(id);
//       rewardToken.token = getOrCreateToken(COMP_ADDRESS).id;
//       rewardToken.type = type;
//       rewardToken.save();
//     }
//     return rewardToken;
//   }

//   export function getOrCreateRate(rateSide: string, rateType: string, marketId: string): InterestRate {
//     let id = rateSide + "-" + rateType + "-" + marketId;
//     let rate = InterestRate.load(id);
//     if (rate == null) {
//       rate = new InterestRate(id);
//       rate.rate = BIGDECIMAL_ZERO;
//       rate.side = rateSide;
//       rate.type = rateType;
//       rate.save();
//     }
//     return rate;
//   }
