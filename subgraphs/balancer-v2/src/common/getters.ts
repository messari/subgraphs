import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  LiquidityPoolFee,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  Swap,
  PoolDailySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  VAULT_ADDRESS,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
} from "./constants";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { ConvergentCurvePool } from "../../generated/Vault/ConvergentCurvePool";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(VAULT_ADDRESS.toHexString());
  let network = dataSource.network();
  if (network === "polygon") {
    network = Network.POLYGON;
  } else {
    network = Network.ETHEREUM;
  }

  if (protocol === null) {
    protocol = new DexAmmProtocol(VAULT_ADDRESS.toHexString());
    protocol.name = "Balancer V2";
    protocol.schemaVersion = "1.1.0";
    protocol.subgraphVersion = "1.1.0";
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.network = network;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress.toHexString().toLowerCase());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

export function createPool(id: string, address: Address, blockInfo: ethereum.Block): void {
  let pool = new LiquidityPool(id);
  let outputToken = getOrCreateToken(address);
  let protocol = getOrCreateDex();

  let wwPoolInstance = WeightedPool.bind(address);
  let swapFees: BigInt = BigInt.fromI32(0);
  let swapFeesCall = wwPoolInstance.try_getSwapFeePercentage();
  if (!swapFeesCall.reverted) {
    swapFees = swapFeesCall.value;
  } else {
    let convergentCurvePool = ConvergentCurvePool.bind(address);
    swapFeesCall = convergentCurvePool.try_percentFee();
    if (!swapFeesCall.reverted) {
      swapFees = swapFeesCall.value;
    }
  }

  let feeInDecimals = swapFees.divDecimal(BigInt.fromI32(10).pow(18).toBigDecimal());

  let fee = new LiquidityPoolFee(id);
  fee.feePercentage = feeInDecimals;
  fee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE;
  fee.save();

  pool.protocol = protocol.id;
  pool.fees = [fee.id];
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.totalVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool._totalSwapFee = BIGDECIMAL_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  pool.createdBlockNumber = blockInfo.number;
  pool.createdTimestamp = blockInfo.timestamp;
  pool.outputToken = outputToken.id;
  pool.save();

  protocol._poolIds = protocol._poolIds.concat([pool.id]);
  protocol.save();
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateDex().id;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateDex().id;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateSwap(event: ethereum.Event, pool: LiquidityPool): Swap {
  const id = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString());
  const protocol = getOrCreateDex();
  let swap = Swap.load(id);

  if (!swap) {
    swap = new Swap(id);
    swap.hash = event.transaction.hash.toHexString();
    swap.logIndex = event.logIndex.toI32();
    swap.from = event.transaction.from.toHexString();
    swap.to = event.transaction.from.toHexString();
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.protocol = protocol.id;
    swap.pool = pool.id;
  }

  return swap;
}

export function updatePoolDailySnapshot(event: ethereum.Event, pool: LiquidityPool): void {
  // Number of days since Unix epoch
  const daysSinceEpoch: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = pool.id.concat("-").concat(daysSinceEpoch.toString());
  let snapshot = PoolDailySnapshot.load(id);
  if (!snapshot) {
    snapshot = new PoolDailySnapshot(id);
    snapshot.protocol = pool.protocol;
    snapshot.pool = pool.id;
    snapshot.inputTokenBalances = pool.inputTokenBalances;
  }
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.totalVolumeUSD = pool.totalVolumeUSD;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}
