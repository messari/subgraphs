import { Protobuf } from "as-proto";
import { BigDecimal, BigInt, cosmos } from "@graphprotocol/graph-ts";
import {
  Account,
  Token,
  DexAmmProtocol,
  FinancialsDailySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPool as LiquidityPoolStore,
  LiquidityPoolFee,
} from "../../generated/schema";
import * as constants from "../common/constants";
import * as utils from "../common/utils";
import { MsgCreateBalancerPool } from "../modules/Decoder";
import { initRegistry } from "./registry";
import { Versions } from "../versions";

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
  const protocolId = constants.Protocol.NAME;
  let protocol = DexAmmProtocol.load(protocolId);
  if (!protocol) {
    protocol = new DexAmmProtocol(protocolId);
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
    protocol.network = constants.Network.OSMOSIS;
    protocol.type = constants.ProtocolType.EXCHANGE;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function getOrCreateToken(denom: string): Token {
  let token = Token.load(denom);

  if (!token) {
    token = new Token(denom);
    token.name = denom;
    token.symbol = denom;
    token.decimals = 18;
    token._isStableCoin = false;
    token.save();
  }

  return token;
}

export function getOrCreateFinancialDailySnapshots(
  block: cosmos.HeaderOnlyBlock
): FinancialsDailySnapshot {
  const id = block.header.time.seconds / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.Protocol.NAME;

    const protocol = getOrCreateDexAmmProtocol();
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;

    financialMetrics.blockNumber = BigInt.fromI32(block.header.height as i32);
    financialMetrics.timestamp = BigInt.fromI32(
      block.header.time.seconds as i32
    );

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: cosmos.HeaderOnlyBlock
): UsageMetricsDailySnapshot {
  const id = (block.header.time.seconds / constants.SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.Protocol.NAME;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;

    const protocol = getOrCreateDexAmmProtocol();
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.blockNumber = BigInt.fromI32(block.header.height as i32);
    usageMetrics.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: cosmos.HeaderOnlyBlock
): UsageMetricsHourlySnapshot {
  const metricsID: string = (
    block.header.time.seconds / constants.SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.Protocol.NAME;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;

    const protocol = getOrCreateDexAmmProtocol();
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.blockNumber = BigInt.fromI32(block.header.height as i32);
    usageMetrics.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshots(
  liquidityPoolId: string,
  block: cosmos.HeaderOnlyBlock
): LiquidityPoolDailySnapshot | null {
  const id: string = liquidityPoolId
    .concat("-")
    .concat((block.header.time.seconds / constants.SECONDS_PER_DAY).toString());
  let poolSnapshots = LiquidityPoolDailySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new LiquidityPoolDailySnapshot(id);
    poolSnapshots.protocol = constants.Protocol.NAME;
    poolSnapshots.pool = liquidityPoolId;

    const pool = LiquidityPoolStore.load(liquidityPoolId);
    if (!pool) {
      return null;
    }

    poolSnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;
    const inputTokenLength = pool.inputTokens.length;
    poolSnapshots.dailyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.dailyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = pool.outputTokenSupply;
    poolSnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

    poolSnapshots.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;

    poolSnapshots.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;

    poolSnapshots.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

    poolSnapshots.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;

    poolSnapshots.blockNumber = BigInt.fromI32(block.header.height as i32);
    poolSnapshots.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function getOrCreateLiquidityPoolHourlySnapshots(
  liquidityPoolId: string,
  block: cosmos.HeaderOnlyBlock
): LiquidityPoolHourlySnapshot | null {
  const id: string = liquidityPoolId
    .concat("-")
    .concat(
      (block.header.time.seconds / constants.SECONDS_PER_HOUR).toString()
    );
  let poolSnapshots = LiquidityPoolHourlySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new LiquidityPoolHourlySnapshot(id);
    poolSnapshots.protocol = constants.Protocol.NAME;
    poolSnapshots.pool = liquidityPoolId;

    const pool = LiquidityPoolStore.load(liquidityPoolId);
    if (!pool) {
      return null;
    }

    poolSnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;
    const inputTokenLength = pool.inputTokens.length;
    poolSnapshots.hourlyVolumeByTokenAmount = new Array<BigInt>(
      inputTokenLength
    ).fill(constants.BIGINT_ZERO);
    poolSnapshots.hourlyVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokenLength
    ).fill(constants.BIGDECIMAL_ZERO);

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;
    poolSnapshots.inputTokenWeights = pool.inputTokenWeights;

    poolSnapshots.outputTokenSupply = pool.outputTokenSupply;
    poolSnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

    poolSnapshots.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;

    poolSnapshots.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;

    poolSnapshots.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

    poolSnapshots.hourlyVolumeUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;

    poolSnapshots.blockNumber = BigInt.fromI32(block.header.height as i32);
    poolSnapshots.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function msgCreatePoolHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  initRegistry();

  const poolId = getPoolId(data.tx.result.events);
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(
    poolId.toString()
  );
  const liquidityPool = new LiquidityPoolStore(liquidityPoolId);

  const message = Protobuf.decode<MsgCreateBalancerPool>(
    msgValue,
    MsgCreateBalancerPool.decode
  );
  liquidityPool.name = `${message.poolAssets[0].token!.denom} / ${
    message.poolAssets[1].token!.denom
  }`;

  liquidityPool.symbol = "gamm/pool/".concat(poolId.toString());
  liquidityPool.protocol = constants.Protocol.NAME;

  const inputTokens: string[] = [];
  const inputTokenBalances: BigInt[] = [];
  const inputTokenWeights: BigDecimal[] = [];
  let tokenWeight = constants.BIGDECIMAL_ZERO;
  let totalPoolWeight = constants.BIGDECIMAL_ZERO;
  for (let i = 0; i < message.poolAssets.length; i++) {
    inputTokens.push(getOrCreateToken(message.poolAssets[i].token!.denom).id);
    inputTokenBalances.push(message.poolAssets[i].token!.amount);

    tokenWeight = message.poolAssets[i].weight.toBigDecimal();
    inputTokenWeights.push(tokenWeight);
    totalPoolWeight = totalPoolWeight.plus(tokenWeight);
  }

  for (let i = 0; i < inputTokenWeights.length; i++) {
    inputTokenWeights[i] = inputTokenWeights[i]
      .div(totalPoolWeight)
      .times(constants.BIGDECIMAL_HUNDRED);
  }

  liquidityPool.inputTokens = inputTokens;
  liquidityPool.inputTokenBalances = inputTokenBalances;
  liquidityPool.inputTokenWeights = inputTokenWeights;
  liquidityPool.outputToken = getOrCreateToken(
    "PoolToken".concat("-").concat(poolId.toString())
  ).id;
  liquidityPool.outputTokenSupply = constants.BIGINT_ZERO;
  liquidityPool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

  liquidityPool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  liquidityPool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
  liquidityPool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  liquidityPool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
  liquidityPool.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

  liquidityPool.rewardTokens = [];
  liquidityPool.rewardTokenEmissionsAmount = [];
  liquidityPool.rewardTokenEmissionsUSD = [];

  liquidityPool.fees = utils
    .getPoolFees(liquidityPoolId.toString(), message.poolParams)
    .stringIds();
  liquidityPool.isSingleSided = false;

  liquidityPool.createdBlockNumber = BigInt.fromI32(data.tx.height as i32);
  liquidityPool.createdTimestamp = BigInt.fromI32(
    data.block.header.time.seconds as i32
  );
  liquidityPool.save();

  utils.updatePoolTVL(liquidityPool, data.block);
  utils.updateProtocolAfterNewLiquidityPool(liquidityPool.totalValueLockedUSD);

  return;
}

function getPoolId(events: cosmos.Event[]): BigInt {
  for (let idx = 0; idx < events.length; idx++) {
    if (events[idx].eventType == "pool_created") {
      return BigInt.fromString(events[idx].getAttributeValue("pool_id"));
    }
  }

  return constants.BIGINT_ZERO;
}
