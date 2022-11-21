import {
  Token,
  Account,
  RewardToken,
  LiquidityPool,
  DexAmmProtocol,
  LiquidityPoolFee,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  LiquidityPoolDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPoolHourlySnapshot,
} from "../../generated/schema";
import * as utils from "./utils";
import * as constants from "./constants";
import { getUsdPricePerToken } from "../prices";
import { LpToken as LPTokenContract } from "../../generated/Factory/LpToken";
import { Address, ethereum, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";
import { PoolTemplate } from "../../generated/templates";

export function getOrCreateLiquidityPool(
  address: Address,
  block: ethereum.Block,
  registryAddress: Address = constants.ADDRESS_ZERO
): LiquidityPool {
  const poolId = address.toHexString();
  let liquidityPool = LiquidityPool.load(poolId);
  if (!liquidityPool) {
    liquidityPool = new LiquidityPool(poolId);
    liquidityPool.protocol = constants.REGISTRY_ADDRESS.toHexString();
    liquidityPool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    liquidityPool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    liquidityPool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    liquidityPool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    liquidityPool.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    if (!registryAddress.equals(constants.ADDRESS_ZERO)) {
      liquidityPool._registry = registryAddress.toHexString();
    }
    const lpToken = utils.getLpTokenFromPool(address, block, registryAddress);

    const lpTokenContract = LPTokenContract.bind(
      Address.fromString(lpToken.id)
    );

    liquidityPool.name = utils.readValue<string>(
      lpTokenContract.try_name(),
      ""
    );
    liquidityPool.symbol = utils.readValue<string>(
      lpTokenContract.try_symbol(),
      ""
    );

    liquidityPool.inputTokens = utils.getPoolCoins(address, block);
    liquidityPool._underlyingTokens = utils.getPoolUnderlyingCoins(
      address,
      registryAddress
    );

    liquidityPool.inputTokenBalances = utils.getPoolBalances(
      address,
      liquidityPool.inputTokens
    );
    liquidityPool.inputTokenWeights = utils.getPoolTokenWeights(
      liquidityPool.inputTokens,
      liquidityPool.inputTokenBalances,
      constants.BIGDECIMAL_ZERO,
      block
    );
    liquidityPool.fees = utils.getPoolFees(address).stringIds();

    liquidityPool.outputToken = lpToken.id;
    liquidityPool.outputTokenSupply = constants.BIGINT_ZERO;
    liquidityPool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    liquidityPool.rewardTokens = [];
    liquidityPool.rewardTokenEmissionsAmount = [];
    liquidityPool.rewardTokenEmissionsUSD = [];

    liquidityPool.isSingleSided = false;
    liquidityPool.createdTimestamp = block.timestamp;
    liquidityPool.createdBlockNumber = block.number;
    utils.updateProtocolAfterNewLiquidityPool(address);
    liquidityPool.save();

    PoolTemplate.create(address);
  }
  return liquidityPool;
}

export function getOrCreateDexAmmProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(constants.REGISTRY_ADDRESS.toHexString());

  if (!protocol) {
    protocol = new DexAmmProtocol(constants.REGISTRY_ADDRESS.toHexString());
    protocol.name = constants.PROTOCOL_NAME;
    protocol.slug = constants.PROTOCOL_SLUG;
    protocol.schemaVersion = constants.PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = constants.PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = constants.PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = constants.Network.BSC;
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

    protocol.save();
  }

  return protocol;
}
export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

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
    poolSnapshots.protocol = constants.REGISTRY_ADDRESS.toHexString();
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
    poolSnapshots.protocol = constants.REGISTRY_ADDRESS.toHexString();
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
    token.decimals = utils.readValue<i32>(
      contract.try_decimals(),
      BigInt.fromI32(constants.DEFAULT_DECIMALS).toI32() as u8
    );

    if (address.equals(constants.ETH_ADDRESS)) {
      token.name = constants.ETH_NAME;
      token.symbol = constants.ETH_SYMBOL;
      token.decimals = constants.DEFAULT_DECIMALS;
    }

    const tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice;
    token.lastPriceBlockNumber = block.number;
    token.save();
  }

  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.BSC_AVERAGE_BLOCK_PER_HOUR)
  ) {
    const tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice;
    token.lastPriceBlockNumber = block.number;

    token.save();
  }

  return token;
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
