import {
  Bytes,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Account,
  RewardToken,
  DexAmmProtocol,
  LiquidityPoolFee,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
} from "../../generated/schema";
import * as utils from "./utils";
import { Versions } from "../versions";
import * as constants from "./constants";
import { getRewardsPerDay } from "./rewards";
import { getUsdPricePerToken } from "../prices";
import { ERC20 as ERC20Contract } from "../../generated/Vault/ERC20";
import { protocolLevelPriceValidation } from "../prices/common/validation";
import { LiquidityPool as LiquidityPoolStore } from "../../generated/schema";
import { WeightedPool as WeightedPoolContract } from "../../generated/templates/WeightedPool/WeightedPool";

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
  RewardTokenType: string,
  block: ethereum.Block
): RewardToken {
  let rewardToken = RewardToken.load(
    RewardTokenType + "-" + address.toHexString()
  );

  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());
    const token = getOrCreateToken(address, block);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType;

    if (address == constants.PROTOCOL_TOKEN_ADDRESS) {
      rewardToken._inflationRate = constants.STARTING_INFLATION_RATE;
      rewardToken._inflationPerDay = getRewardsPerDay(
        block.timestamp,
        block.number,
        constants.STARTING_INFLATION_RATE,
        constants.INFLATION_INTERVAL
      );
    }

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
  let protocol = DexAmmProtocol.load(constants.VAULT_ADDRESS.toHexString());

  if (!protocol) {
    protocol = new DexAmmProtocol(constants.VAULT_ADDRESS.toHexString());
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
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
  block: ethereum.Block,
  fetchlatestPrice: boolean = false
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils
      .readValue<BigInt>(contract.try_decimals(), constants.BIGINT_ZERO)
      .toI32();

    token.lastPriceUSD = constants.BIGDECIMAL_ZERO;
    token._totalSupply = constants.BIGINT_ZERO;
    token._totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    token._largePriceChangeBuffer = 0;
    token._largeTVLImpactBuffer = 0;

    if (constants.assets.stableAssets.includes(address))
      token.lastPriceUSD = constants.BIGDECIMAL_ONE;

    token.lastPriceBlockNumber = block.number;
    token.save();
  }

  if (constants.USE_SWAP_BASED_PRICE_LIB) return token;

  if (
    fetchlatestPrice ||
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.PRICE_CACHING_BLOCKS)
  ) {
    const tokenPrice = getUsdPricePerToken(address, block);
    const latestPrice = tokenPrice.usdPrice;

    token.lastPriceUSD = protocolLevelPriceValidation(token, latestPrice);
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
    financialMetrics.protocol = constants.VAULT_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.VAULT_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.VAULT_ADDRESS.toHexString();

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
    poolSnapshots.protocol = constants.VAULT_ADDRESS.toHexString();
    poolSnapshots.pool = poolId;

    const pool = getOrCreateLiquidityPool(Address.fromString(poolId), block);
    const inputTokenLength = pool.inputTokens.length;

    poolSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.dailyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    poolSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

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
    poolSnapshots.protocol = constants.VAULT_ADDRESS.toHexString();
    poolSnapshots.pool = poolId;

    poolSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    const pool = getOrCreateLiquidityPool(Address.fromString(poolId), block);
    const inputTokenLength = pool.inputTokens.length;

    poolSnapshots.hourlyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.hourlyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    poolSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

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

    const poolContract = WeightedPoolContract.bind(poolAddress);

    pool.name = utils.readValue<string>(poolContract.try_name(), "");
    pool.symbol = utils.readValue<string>(poolContract.try_symbol(), "");
    pool.protocol = constants.VAULT_ADDRESS.toHexString();

    const poolId = utils.readValue<Bytes>(
      poolContract.try_getPoolId(),
      Bytes.empty()
    );
    pool._poolId = poolId.toHexString();

    const inputTokensInfo = utils.getPoolTokensInfo(poolAddress, poolId);
    pool.inputTokens = inputTokensInfo.getInputTokens;
    pool.inputTokenBalances = inputTokensInfo.getBalances;
    pool.inputTokenWeights = utils.getPoolTokenWeights(
      poolAddress,
      pool.inputTokens
    );

    pool.outputToken = getOrCreateToken(poolAddress, block).id;

    pool.outputTokenSupply = constants.BIGINT_ZERO;
    pool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    pool.rewardTokens = [];
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.fees = utils.calculatePoolFees(poolAddress).stringIds();
    pool.isSingleSided = false;

    pool.createdBlockNumber = block.number;
    pool.createdTimestamp = block.timestamp;

    utils.updateProtocolAfterNewLiquidityPool(poolAddress);

    pool.save();
  }

  return pool;
}
