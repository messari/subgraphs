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
} from "../common/constants";
import { exponentToBigDecimal } from "./utils/numbers";
import { getUsdPrice } from "../prices";

let altPoolsInit = false;

export function initAltPoolTemplates(event: ethereum.Event): void {
  // Start watching the LiquidityPools
  // Note: I have no idea what happens if I create a dynamic datasource
  // that clashes with an exisiting datasource
  if (!altPoolsInit) {
    altPoolsInit = true;
    let altArray = poolDetail.getAltPoolAddressArray();
    for (let i = 0; i < altArray.length; i++) {
      let poolAddress = Address.fromString(altArray[i]);
      getOrCreateLiquidityPool(poolAddress, event);
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
    log.warning("updating price for token {} for event: {}", [
      tokenAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
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

export function getOrCreateLiquidityPool(poolAddress: Address, event: ethereum.Event): LiquidityPool {
  let _address = poolAddress.toHexString();
  let pool = LiquidityPool.load(_address);
  // fetch info if null
  if (!pool) {
    pool = new LiquidityPool(_address);
    let tradingFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_TRADING_FEE.concat(_address));
    tradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
    tradingFee.save();

    let withdrawFee = new LiquidityPoolFee(LiquidityPoolFeeType.WITHDRAWAL_FEE.concat(_address));
    withdrawFee.feeType = LiquidityPoolFeeType.WITHDRAWAL_FEE;
    withdrawFee.save();

    let depositFee = new LiquidityPoolFee(LiquidityPoolFeeType.DEPOSIT_FEE.concat(_address));
    depositFee.feeType = LiquidityPoolFeeType.DEPOSIT_FEE;
    depositFee.save();

    pool.fees = [tradingFee.id, withdrawFee.id, depositFee.id];

    pool.protocol = PROTOCOL_ADMIN;
    getOrCreateLiquidityPoolParamsHelper(event, poolAddress);

    let detail: poolDetail = poolDetail.fromAddress(_address);
    pool.name = detail.name;
    pool.symbol = detail.symbol;
    pool._ignore = detail.ignore;

    pool.isSingleSided = true;
    pool._assets = new Array<string>();
    pool.inputTokens = new Array<string>();
    pool.inputTokenBalances = new Array<BigInt>();
    pool._stakedAssetsAmounts = new Array<BigInt>();

    pool.createdBlockNumber = event.block.number;
    pool.createdTimestamp = event.block.timestamp;
    pool.save();

    initAltPoolTemplates(event);

    let protocol = getOrCreateDexAmm();
    let _pools: string[] = protocol.pools;
    _pools.push(pool.id);
    protocol.pools = _pools.sort();
    protocol.save();
  }

  return pool;
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

export function getOrCreateLiquidityPoolDailySnapshot(event: ethereum.Event): LiquidityPoolDailySnapshot {
  let timestamp: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let id: string = poolAddress.concat("-").concat(timestamp.toString());

  let poolDailyMetrics = LiquidityPoolDailySnapshot.load(id);
  let pool = getOrCreateLiquidityPool(Address.fromString(poolAddress), event);

  if (!poolDailyMetrics) {
    poolDailyMetrics = new LiquidityPoolDailySnapshot(id);
    poolDailyMetrics.protocol = PROTOCOL_ADMIN;
    poolDailyMetrics.pool = pool.id;
    poolDailyMetrics.rewardTokenEmissionsAmount = new Array<BigInt>();
    poolDailyMetrics.rewardTokenEmissionsUSD = new Array<BigDecimal>();
    poolDailyMetrics._inputTokens = pool.inputTokens;
    poolDailyMetrics._assets = pool._assets;
    poolDailyMetrics._stakedAssetsAmounts = pool._stakedAssetsAmounts;
    poolDailyMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolDailyMetrics.blockNumber = event.block.number;
    poolDailyMetrics.timestamp = event.block.timestamp;

    poolDailyMetrics.blockNumber = event.block.number;
    poolDailyMetrics.timestamp = event.block.timestamp;

    let dailyVolumeByTokenUSD: BigDecimal[] = new Array<BigDecimal>();
    let dailyVolumeByTokenAmount: BigInt[] = new Array<BigInt>();

    for (let i = 0; i < poolDailyMetrics._inputTokens!.length; i++) {
      dailyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
      dailyVolumeByTokenAmount.push(BigInt.fromString("0"));
    }
    poolDailyMetrics.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
    poolDailyMetrics.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;

    poolDailyMetrics.save();
  }

  return poolDailyMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let poolAddress = event.address.toHexString();
  let timestamp: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let id: string = poolAddress.concat("-").concat(timestamp.toString());

  let poolHourlyMetrics = LiquidityPoolHourlySnapshot.load(id);

  let pool = getOrCreateLiquidityPool(event.address, event);
  if (!poolHourlyMetrics) {
    poolHourlyMetrics = new LiquidityPoolHourlySnapshot(id);
    poolHourlyMetrics.protocol = PROTOCOL_ADMIN;
    poolHourlyMetrics.pool = pool.id;
    poolHourlyMetrics._inputTokens = pool.inputTokens;
    poolHourlyMetrics._assets = pool._assets;
    poolHourlyMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolHourlyMetrics._stakedAssetsAmounts = pool._stakedAssetsAmounts;
    poolHourlyMetrics.blockNumber = event.block.number;
    poolHourlyMetrics.timestamp = event.block.timestamp;
    poolHourlyMetrics.rewardTokenEmissionsAmount = new Array<BigInt>();
    poolHourlyMetrics.rewardTokenEmissionsUSD = new Array<BigDecimal>();

    let hourlyVolumeByTokenUSD: BigDecimal[] = new Array<BigDecimal>();
    let hourlyVolumeByTokenAmount: BigInt[] = new Array<BigInt>();

    for (let i = 0; i < poolHourlyMetrics._inputTokens!.length; i++) {
      hourlyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
      hourlyVolumeByTokenAmount.push(BigInt.fromString("0"));
    }

    poolHourlyMetrics.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
    poolHourlyMetrics.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;

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
  }
  return protocol;
}

export function getOrCreateAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): _Asset {
  let id = assetAddress.toHexString();

  let _asset = _Asset.load(id);
  // fetch info if null
  if (!_asset) {
    _asset = new _Asset(id);
    _asset.symbol = fetchTokenSymbol(assetAddress);
    _asset.name = fetchTokenName(assetAddress);
    _asset.decimals = fetchTokenDecimals(assetAddress);

    _asset.token = tokenAddress.toHexString();
    _asset.pool = poolAddress.toHexString();
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
