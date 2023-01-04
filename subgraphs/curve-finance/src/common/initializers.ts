import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Account,
  _LpToken,
  RewardToken,
  DexAmmProtocol,
  _LiquidityGauge,
  LiquidityPoolFee,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
} from "../../generated/schema";
import * as utils from "./utils";
import {
  PoolTemplate,
  LiquidityGauge as LiquidityGaugeTemplate,
} from "../../generated/templates";
import { Versions } from "../versions";
import * as constants from "./constants";
import { getUsdPricePerToken } from "../prices";
import { LiquidityPool as LiquidityPoolStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateDexAmmProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}

export function getOrCreateRewardToken(
  address: Address,
  block: ethereum.Block
): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());

  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());

    const token = getOrCreateToken(address, block);
    rewardToken.token = token.id;
    rewardToken.type = constants.RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateLiquidityPoolFee(
  feeId: string,
  feeType: string,
  feePercentage: BigDecimal = constants.BIGDECIMAL_ZERO
): LiquidityPoolFee {
  let fees = LiquidityPoolFee.load(feeId);

  if (!fees) {
    fees = new LiquidityPoolFee(feeId);

    fees.feeType = feeType;
    fees.feePercentage = feePercentage;

    fees.save();
  }

  if (feePercentage.notEqual(constants.BIGDECIMAL_ZERO)) {
    fees.feePercentage = feePercentage;

    fees.save();
  }

  return fees;
}

export function getOrCreateDexAmmProtocol(): DexAmmProtocol {
  const protocolId = constants.PROTOCOL_ID.toHexString();
  let protocol = DexAmmProtocol.load(protocolId);

  if (!protocol) {
    protocol = new DexAmmProtocol(protocolId);
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
    protocol.schemaVersion = constants.Protocol.SCHEMA_VERSION;
    protocol.subgraphVersion = constants.Protocol.SUBGRAPH_VERSION;
    protocol.methodologyVersion = constants.Protocol.METHODOLOGY_VERSION;
    protocol.network = constants.Protocol.NETWORK;
    protocol.type = constants.ProtocolType.EXCHANGE;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol._poolIds = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateToken(
  address: Address,
  block: ethereum.Block
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils
      .readValue<BigInt>(contract.try_decimals(), constants.DEFAULT_DECIMALS)
      .toI32();

    if (address.equals(constants.ETH_ADDRESS)) {
      token.name = "ETH";
      token.symbol = "ETH";
      token.decimals = constants.DEFAULT_DECIMALS.toI32();
    }

    const tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;
    token.save();
  }

  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.PRICE_CACHING_BLOCKS)
  ) {
    const tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;

    token.save();
  }

  return token;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.PROTOCOL_ID.toHexString();

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  const id: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  ).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.PROTOCOL_ID.toHexString();

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    const protocol = getOrCreateDexAmmProtocol();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  const metricsID: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.PROTOCOL_ID.toHexString();

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshots(
  poolId: string,
  block: ethereum.Block
): LiquidityPoolDailySnapshot {
  const id: string = poolId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let poolSnapshots = LiquidityPoolDailySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new LiquidityPoolDailySnapshot(id);
    poolSnapshots.protocol = constants.PROTOCOL_ID.toHexString();
    poolSnapshots.pool = poolId;

    const pool = getOrCreateLiquidityPool(Address.fromString(poolId), block);
    const inputTokenLength = pool.inputTokens.length;

    poolSnapshots.dailyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.dailyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = pool.outputTokenSupply;
    poolSnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

    poolSnapshots.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolSnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    poolSnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;

    poolSnapshots.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.blockNumber = block.number;
    poolSnapshots.timestamp = block.timestamp;

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function getOrCreateLiquidityPoolHourlySnapshots(
  poolId: string,
  block: ethereum.Block
): LiquidityPoolHourlySnapshot {
  const id: string = poolId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let poolSnapshots = LiquidityPoolHourlySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new LiquidityPoolHourlySnapshot(id);
    poolSnapshots.protocol = constants.PROTOCOL_ID.toHexString();
    poolSnapshots.pool = poolId;

    const pool = getOrCreateLiquidityPool(Address.fromString(poolId), block);

    const inputTokenLength = pool.inputTokens.length;
    poolSnapshots.hourlyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.hourlyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = pool.outputTokenSupply;
    poolSnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

    poolSnapshots.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolSnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    poolSnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;

    poolSnapshots.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.hourlyVolumeUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.blockNumber = block.number;
    poolSnapshots.timestamp = block.timestamp;

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function getOrCreateLiquidityGauge(
  gaugeAddress: Address,
  poolAddress: Address | null = null
): _LiquidityGauge {
  let liquidityGauge = _LiquidityGauge.load(gaugeAddress.toHexString());

  if (!liquidityGauge) {
    liquidityGauge = new _LiquidityGauge(gaugeAddress.toHexString());

    liquidityGauge.poolAddress = constants.NULL.TYPE_STRING;
    liquidityGauge.save();

    if (poolAddress) {
      const context = new DataSourceContext();
      context.setString("poolAddress", poolAddress.toHexString());

      LiquidityGaugeTemplate.createWithContext(gaugeAddress, context);
    }
  }

  return liquidityGauge;
}

export function getOrCreateLpToken(lpTokenAddress: Address): _LpToken {
  let lpToken = _LpToken.load(lpTokenAddress.toHexString());

  if (!lpToken) {
    lpToken = new _LpToken(lpTokenAddress.toHexString());
    lpToken.poolAddress = constants.NULL.TYPE_STRING;
    lpToken.registryAddress = constants.NULL.TYPE_STRING;

    lpToken.save();
  }

  return lpToken;
}

export function getOrCreateLiquidityPool(
  poolAddress: Address,
  block: ethereum.Block
): LiquidityPoolStore {
  let pool = LiquidityPoolStore.load(poolAddress.toHexString());

  if (!pool) {
    pool = new LiquidityPoolStore(poolAddress.toHexString());

    pool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    const lpToken = utils.getLpTokenFromPool(poolAddress, block);
    if (lpToken.id != constants.NULL.TYPE_STRING) {
      const lpTokenStore = getOrCreateLpToken(Address.fromString(lpToken.id));
      lpTokenStore.poolAddress = poolAddress.toHexString();

      lpTokenStore.save();
    }

    pool.name = lpToken.name;
    pool.symbol = lpToken.symbol;
    pool.protocol = constants.PROTOCOL_ID.toHexString();

    pool._inputTokensOrdered = utils.getPoolCoins(poolAddress, block);
    pool.inputTokens = pool._inputTokensOrdered.sort();

    pool.inputTokenBalances = utils.getPoolBalances(pool);
    pool.inputTokenWeights = utils.getPoolTokenWeights(
      pool.inputTokens,
      pool.inputTokenBalances,
      block
    );

    pool.outputToken = lpToken.id;
    pool.outputTokenSupply = constants.BIGINT_ZERO;
    pool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    pool.rewardTokens = [];
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.fees = utils.getPoolFees(poolAddress).stringIds();
    pool.isSingleSided = false;

    pool.createdBlockNumber = block.number;
    pool.createdTimestamp = block.timestamp;

    utils.updateProtocolAfterNewLiquidityPool(poolAddress);

    pool._registryAddress = constants.NULL.TYPE_STRING;
    pool._gaugeAddress = constants.NULL.TYPE_STRING;
    pool.save();

    PoolTemplate.create(poolAddress);

    log.warning(
      "[NewLiquidityPool] Pool: {}, inputTokens: [{}], outputToken/lpToken: {}",
      [pool.id, pool.inputTokens.join(", "), lpToken.id]
    );
  }

  return pool;
}
