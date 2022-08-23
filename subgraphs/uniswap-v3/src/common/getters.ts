// import { log } from '@graphprotocol/graph-ts'
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { ERC20 } from "../../generated/Factory/ERC20";
import {
  DexAmmProtocol,
  LiquidityPool,
  _HelperStore,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
  Token,
  _TokenWhitelist,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  INT_ZERO,
  BIGDECIMAL_ZERO,
  ProtocolType,
  HelperStoreType,
  DEFAULT_DECIMALS,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  Network,
} from "./constants";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.schemaVersion = NetworkConfigs.getSchemaVersion();
    protocol.subgraphVersion = NetworkConfigs.getSubgraphVersion();
    protocol.methodologyVersion = NetworkConfigs.getMethodologyVersion();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = INT_ZERO;
    protocol._regenesis = false;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    let erc20Contract = ERC20.bind(Address.fromString(address));
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    if (
      token.id == "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase() &&
      NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
    ) {
      token.name = "WETH";
      token.symbol = "WETH";
      token.decimals = DEFAULT_DECIMALS;
    }
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;

    // Fixing token fields that did not return proper values from contract
    // Manually coded in when necessary
    token = fixTokenFields(token);

    token.save();
  }
  return token as Token;
}

export function fixTokenFields(token: Token): Token {
  // Arbitrum
  if (
    token.id == "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase() &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "WETH";
    token.symbol = "WETH";
    token.decimals = DEFAULT_DECIMALS;
  }

  if (
    token.id == "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8".toLowerCase() &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "USDC";
    token.symbol = "USDC";
  }

  if (
    token.id == "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9".toLowerCase() &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "USDT";
    token.symbol = "USDT";
  }

  return token;
}

export function getOrCreateLPToken(
  tokenAddress: string,
  token0: Token,
  token1: Token
): Token {
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress);
    token.symbol = token0.name + "/" + token1.name;
    token.name = token0.name + "/" + token1.name + " LP";
    token.decimals = DEFAULT_DECIMALS;
    token.save();
  }
  return token;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

export function getLiquidityPoolAmounts(
  poolAddress: string
): _LiquidityPoolAmount {
  return _LiquidityPoolAmount.load(poolAddress)!;
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}

export function getFeeTier(event: ethereum.Event): _HelperStore {
  return _HelperStore.load(event.address.toHexString().concat("-FeeTier"))!;
}

export function getOrCreateTokenWhitelist(
  tokenAddress: string
): _TokenWhitelist {
  let tokenTracker = _TokenWhitelist.load(tokenAddress);
  // fetch info if null
  if (!tokenTracker) {
    tokenTracker = new _TokenWhitelist(tokenAddress);

    tokenTracker.whitelistPools = [];
    tokenTracker.save();
  }

  return tokenTracker;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.totalPoolCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshot(
  event: ethereum.Event
): LiquidityPoolDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    event.address.toHexString().concat("-").concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      event.address.toHexString().concat("-").concat(dayId)
    );
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  event: ethereum.Event
): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    event.address.toHexString().concat("-").concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      event.address.toHexString().concat("-").concat(hourId)
    );
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateUsersHelper(): _HelperStore {
  let uniqueUsersTotal = _HelperStore.load(HelperStoreType.USERS);
  if (uniqueUsersTotal === null) {
    uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS);
    uniqueUsersTotal.valueDecimal = BIGDECIMAL_ZERO;
    uniqueUsersTotal.save();
  }
  return uniqueUsersTotal;
}
