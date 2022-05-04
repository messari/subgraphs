// // get or create snapshots and metrics
import {
  FinancialsDailySnapshot,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  VaultDailySnapshot,
  VaultFee,
  VaultHourlySnapshot,
  YieldAggregator,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  INT_ZERO,
  METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_NETWORK,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
  RARI_DEPLOYER,
  RARI_YIELD_POOL_TOKEN,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
  VaultFeeType,
  YIELD_PERFORMANCE_FEE,
  YIELD_TOKEN_MAPPING,
  YIELD_VAULT_NAME,
  YIELD_VAULT_SYMBOL,
  YIELD_WITHDRAWAL_FEE,
} from "./utils/constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

///////////////////
//// Snapshots ////
///////////////////

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

// get vault daily snapshot with default values
export function getOrCreateVaultDailySnapshot(event: ethereum.Event, vaultAddress: string): VaultDailySnapshot {
  let days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let id = vaultAddress + "-" + days.toString();
  let vaultMetrics = VaultDailySnapshot.load(id);

  if (!vaultMetrics) {
    vaultMetrics = new VaultDailySnapshot(id);
    vaultMetrics.protocol = RARI_DEPLOYER;
    vaultMetrics.vault = vaultAddress;
    vaultMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultMetrics.inputTokenBalance = [];
    vaultMetrics.outputTokenSupply = BIGINT_ZERO;
    vaultMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultMetrics.blockNumber = event.block.number;
    vaultMetrics.timestamp = event.block.timestamp;
    vaultMetrics.save();
  }

  return vaultMetrics;
}

export function getOrCreateVaultHourlySnapshot(event: ethereum.Event, vaultAddress: string): VaultHourlySnapshot {
  let hours: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let id = vaultAddress + "-" + hours.toString();
  let vaultMetrics = VaultHourlySnapshot.load(id);

  if (!vaultMetrics) {
    vaultMetrics = new VaultHourlySnapshot(id);
    vaultMetrics.protocol = RARI_DEPLOYER;
    vaultMetrics.vault = vaultAddress;
    vaultMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultMetrics.inputTokenBalance = [];
    vaultMetrics.outputTokenSupply = BIGINT_ZERO;
    vaultMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultMetrics.blockNumber = event.block.number;
    vaultMetrics.timestamp = event.block.timestamp;
    vaultMetrics.save();
  }

  return vaultMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = RARI_DEPLOYER;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////////////
//// Yield Aggregator Specific /////
////////////////////////////////////

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

    // populate input tokens
    let inputTokens: Array<string> = [];
    let inputTokenBalances: Array<BigInt> = [];
    let tokens = YIELD_TOKEN_MAPPING.values();
    for (let i = 0; i < tokens.length; i++) {
      let token = getOrCreateToken(tokens[i]);
      inputTokens.push(token.id);
      inputTokenBalances.push(BIGINT_ZERO);
    }
    vault.inputToken = inputTokens;
    vault.inputTokenBalance = inputTokenBalances;

    let poolToken = getOrCreateToken(RARI_YIELD_POOL_TOKEN);
    vault.outputToken = poolToken.id;
    vault.depositLimit = BIGINT_ZERO;

    // create fees for pool
    let fees: Array<string> = [];
    let withdrawalFee = getOrCreateVaultFee(VaultFeeType.WITHDRAWAL_FEE, vaultAddress);
    withdrawalFee.feePercentage = YIELD_WITHDRAWAL_FEE;
    withdrawalFee.save();
    fees.push(withdrawalFee.id);
    let performanceFee = getOrCreateVaultFee(VaultFeeType.PERFORMANCE_FEE, vaultAddress);
    performanceFee.feePercentage = YIELD_PERFORMANCE_FEE;
    performanceFee.save();
    fees.push(performanceFee.id);
    vault.fees = fees;

    //   vault.fees = TODO
    vault.createdTimestamp = event.block.timestamp;
    vault.createdBlockNumber = event.block.number;
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO; // TODO: can find by dividing TVL by outputTokenSupply

    vault.save();
  }
  return vault;
}

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

export function getOrCreateVaultFee(type: string, vault: string): VaultFee {
  let id = type + "-" + vault;
  let vaultFee = VaultFee.load(id);
  if (vaultFee == null) {
    vaultFee = new VaultFee(id);
    vaultFee.feePercentage = BIGDECIMAL_ZERO;
    vaultFee.feeType = type;
  }
  return vaultFee;
}
