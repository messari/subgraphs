import { BigInt, log } from "@graphprotocol/graph-ts";
import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  _LiquidityPoolParamsHelper,
  _Asset,
  RewardToken,
  LiquidityPoolFee,
  _LiquidityPoolAssetTokenHelper,
} from "../../generated/schema";
import { Pool as PoolTemplate } from "../../generated/templates";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  Network,
  PROTOCOL_ADMIN,
  ProtocolType,
  BIGDECIMAL_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  poolDetail,
  RewardTokenType,
  LiquidityPoolFeeType,
  BIGINT_ZERO,
  ZERO_ADDRESS,
} from "../common/constants";
import { exponentToBigDecimal } from "./utils/numbers";
import { getUsdPrice } from "../prices";

let altPoolsInit = false;

export function initAltPoolTemplates(): void {
  // Start watching the LiquidityPools
  // Note: I have no idea what happens if I create a dynamic datasource
  // that clashes with an exisiting datasource
  if (!altPoolsInit) {
    altPoolsInit = true;
    let altArray = poolDetail.getAltPoolAddressArray();
    for (let i = 0; i < altArray.length; i++) {
      let poolAddress = Address.fromString(altArray[i]);
      // getOrCreateLiquidityPool(poolAddress, event);
      PoolTemplate.create(poolAddress);
    }
  }
}

export function getOrCreateToken(event: ethereum.Event, tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = event.block.number;
  }

  if (token.lastPriceBlockNumber! < event.block.number) {
    token.lastPriceUSD = getUsdPrice(tokenAddress, BigDecimal.fromString("1"));
    if (token.lastPriceUSD == BIGDECIMAL_ZERO) {
      token.lastPriceUSD = BigDecimal.fromString("1");
    }
    token.lastPriceBlockNumber = event.block.number;
  }

  token.save();
  return token;
}

export function getOrCreateLiquidityPoolParamsHelper(
  event: ethereum.Event,
  poolAddress: Address,
): _LiquidityPoolParamsHelper {
  let poolParam = _LiquidityPoolParamsHelper.load(poolAddress.toHexString());

  if (!poolParam) {
    poolParam = new _LiquidityPoolParamsHelper(poolAddress.toHexString());
    poolParam.Dev = PROTOCOL_ADMIN;
    poolParam.SlippageParamsK = BigDecimal.fromString("0.00002e18");
    poolParam.SlippageParamsN = BigDecimal.fromString("7");
    poolParam.SlippageParamsC1 = BigDecimal.fromString("376927610599998308");
    poolParam.SlippageParamsXThreshold = BigDecimal.fromString("329811659274998519");
    poolParam.HaircutRate = BigDecimal.fromString("0.0003e18");
    poolParam.RetentionRatio = exponentToBigDecimal(18);
    poolParam.PriceDeviation = BigDecimal.fromString("0.02e18");
    poolParam.updateBlockNumber = event.block.number;
    poolParam.save();
  }

  return poolParam;
}

function getOrCreateLiquidityPoolFeeType(feeType: string, poolAddress: Address): LiquidityPoolFee {
  let id = feeType.concat("-").concat(poolAddress.toHexString());
  let liquidityPoolFee = LiquidityPoolFee.load(id);
  if (!liquidityPoolFee) {
    liquidityPoolFee = new LiquidityPoolFee(id);
    liquidityPoolFee.feeType = feeType;
    liquidityPoolFee.save();
  }
  return liquidityPoolFee;
}

function getOrCreateLiquidityPoolFeeTypes(poolAddress: Address): string[] {
  let tradingFee = getOrCreateLiquidityPoolFeeType(LiquidityPoolFeeType.FIXED_TRADING_FEE, poolAddress);
  let withdrawFee = getOrCreateLiquidityPoolFeeType(LiquidityPoolFeeType.WITHDRAWAL_FEE, poolAddress);
  let depositFee = getOrCreateLiquidityPoolFeeType(LiquidityPoolFeeType.DEPOSIT_FEE, poolAddress);
  return [tradingFee.id, withdrawFee.id, depositFee.id];
}

function addPoolToProtocol(poolId: string, ignore: bool): void {
  let protocol = getOrCreateDexAmm();
  let _pools: string[] = protocol.pools;
  _pools.push(poolId);
  protocol.pools = _pools.sort();

  if (!ignore) {
    protocol.totalPoolCount = protocol.totalPoolCount + 1;
  }

  protocol.save();
}

export function getTokenHelperId(poolAddress: Address, tokenAddress: Address): string {
  return poolAddress.toHexString().concat("-").concat(tokenAddress.toHexString());
}

function indexAssetForPoolToken(
  event: ethereum.Event,
  poolAddress: Address,
  assetAddress: Address,
  tokenAddress: Address,
): void {
  let id = getTokenHelperId(poolAddress, tokenAddress);
  let helper = _LiquidityPoolAssetTokenHelper.load(id);
  if (!helper) {
    helper = new _LiquidityPoolAssetTokenHelper(id);
    helper.asset = assetAddress.toHexString();
    helper.save();
  }
}

export function getOrCreateAssetPool(
  event: ethereum.Event,
  assetAddress: Address,
  poolAddress: Address,
  tokenAddress: Address,
): LiquidityPool {
  let poolId = assetAddress.toHexString();
  let pool = LiquidityPool.load(poolId);

  if (!pool) {
    pool = new LiquidityPool(poolId);
    pool.poolAddress = poolAddress.toHexString();
    pool.protocol = PROTOCOL_ADMIN;
    pool.fees = getOrCreateLiquidityPoolFeeTypes(poolAddress);

    let token = getOrCreateToken(event, tokenAddress);
    let detail: poolDetail = poolDetail.fromAddress(poolAddress.toHexString());

    pool.name = token.symbol.concat(" on ").concat(detail.name);
    pool.symbol = token.symbol.concat("-").concat(detail.symbol);
    pool.inputTokens = [token.id];
    pool.outputToken = getOrCreateToken(event, assetAddress).id;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool._ignore = detail.ignore;
    pool.isSingleSided = true;
    pool.createdBlockNumber = event.block.number;
    pool.createdTimestamp = event.block.timestamp;
    pool.inputTokenWeights = [BigDecimal.fromString("100")];
    pool.save();

    indexAssetForPoolToken(event, poolAddress, assetAddress, tokenAddress);
    addPoolToProtocol(poolId, pool._ignore);
  }

  return pool;
}

export function getAssetAddressForPoolToken(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
): Address {
  let id = getTokenHelperId(poolAddress, tokenAddress);
  let helper = _LiquidityPoolAssetTokenHelper.load(id);
  if (helper) {
    return Address.fromString(helper.asset);
  }
  return ZERO_ADDRESS;
}

export function getOrCreateDailyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = PROTOCOL_ADMIN;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateHourlyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // " { # of hours since Unix epoch time } "
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = PROTOCOL_ADMIN;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshot(
  event: ethereum.Event,
  assetAddress: Address,
  poolAddress: Address,
  tokenAddress: Address,
): LiquidityPoolDailySnapshot {
  let timestamp: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let id: string = assetAddress.toHexString().concat("-").concat(timestamp.toString());

  let poolDailyMetrics = LiquidityPoolDailySnapshot.load(id);

  if (!poolDailyMetrics) {
    let pool = getOrCreateAssetPool(event, assetAddress, poolAddress, tokenAddress);
    poolDailyMetrics = new LiquidityPoolDailySnapshot(id);
    poolDailyMetrics.protocol = PROTOCOL_ADMIN;
    poolDailyMetrics.pool = pool.id;
    poolDailyMetrics.blockNumber = event.block.number;
    poolDailyMetrics.timestamp = event.block.timestamp;
    poolDailyMetrics.inputTokenWeights = pool.inputTokenWeights;

    poolDailyMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolDailyMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolDailyMetrics.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
    poolDailyMetrics.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
    poolDailyMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolDailyMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
    poolDailyMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolDailyMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
    poolDailyMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolDailyMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

    poolDailyMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO];
    poolDailyMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO];

    poolDailyMetrics.save();
  }

  return poolDailyMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  event: ethereum.Event,
  assetAddress: Address,
  poolAddress: Address,
  tokenAddress: Address,
): LiquidityPoolHourlySnapshot {
  let timestamp: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let id: string = assetAddress.toHexString().concat("-").concat(timestamp.toString());

  let poolHourlyMetrics = LiquidityPoolHourlySnapshot.load(id);

  if (!poolHourlyMetrics) {
    let pool = getOrCreateAssetPool(event, assetAddress, poolAddress, tokenAddress);
    poolHourlyMetrics = new LiquidityPoolHourlySnapshot(id);
    poolHourlyMetrics.protocol = PROTOCOL_ADMIN;
    poolHourlyMetrics.pool = pool.id;
    poolHourlyMetrics.blockNumber = event.block.number;
    poolHourlyMetrics.timestamp = event.block.timestamp;
    poolHourlyMetrics.inputTokenWeights = pool.inputTokenWeights;

    poolHourlyMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolHourlyMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolHourlyMetrics.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
    poolHourlyMetrics.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;
    poolHourlyMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolHourlyMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
    poolHourlyMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolHourlyMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
    poolHourlyMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolHourlyMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

    poolHourlyMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO];
    poolHourlyMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO];

    poolHourlyMetrics.save();
  }

  return poolHourlyMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ADMIN;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDexAmm(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(PROTOCOL_ADMIN);

  if (!protocol) {
    protocol = new DexAmmProtocol(PROTOCOL_ADMIN);
    protocol.name = "Platypus Finance";
    protocol.slug = "platypus-finance";
    protocol.methodologyVersion = "1.0.0";
    protocol.schemaVersion = "1.3.0";
    protocol.subgraphVersion = "1.3.0";
    protocol.network = Network.AVALANCHE;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();
    initAltPoolTemplates();
  }
  return protocol;
}

export function getOrCreateAsset(event: ethereum.Event, tokenAddress: Address, assetAddress: Address): _Asset {
  let id = assetAddress.toHexString();

  let _asset = _Asset.load(id);
  // fetch info if null
  if (!_asset) {
    _asset = new _Asset(id);
    _asset.symbol = fetchTokenSymbol(assetAddress);
    _asset.name = fetchTokenName(assetAddress);
    _asset.decimals = fetchTokenDecimals(assetAddress);
    _asset.token = tokenAddress.toHexString();
    _asset.blockNumber = event.block.number;
    _asset.timestamp = event.block.timestamp;
    _asset.cash = BigInt.zero();
    _asset.save();
  }

  return _asset;
}

export function getOrCreateRewardToken(event: ethereum.Event, tokenAddress: Address): RewardToken {
  let id = RewardTokenType.DEPOSIT.concat("-").concat(tokenAddress.toHexString());
  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.token = getOrCreateToken(event, tokenAddress).id;
    rewardToken.save();
  }
  return rewardToken;
}
