// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "./numbers";

import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolDailySnapshot,
  RewardToken
} from "../../generated/schema";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

import {
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ADDRESS_ZERO,
  Network,
  ProtocolType,
  RewardTokenType,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  STABLE_COINS
} from "../constants/constant";

import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/DVMFactory/ERC20";

import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DSP } from "../../generated/DSP/DSP";
import { DPP } from "../../generated/DPP/DPP";

import { setPriceLP } from "./setters";

export function getOrCreateRewardToken(rewardToken: Address): Token {
  let token = getOrCreateToken(rewardToken);
  // fetch info if null
  let rt = RewardToken.load(rewardToken.toHexString());
  if (!rt) {
    rt = new RewardToken(rewardToken.toHexString());
    rt.token = token.id;
    rt.type = RewardTokenType.DEPOSIT;
  }
  rt.save();
  return token;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceUSD = ZERO_BD;
    token.lastPriceBlockNumber = ZERO_BI;
    token.save();
  }
  return token;
}

export function getOrCreateDexAmm(poolAdd: Address): DexAmmProtocol {
  let proto = getProtocolFromPool(poolAdd);
  let protocol = DexAmmProtocol.load(proto);

  let dvmP = DexAmmProtocol.load(DVMFactory_ADDRESS);
  let cpP = DexAmmProtocol.load(CPFactory_ADDRESS);
  let dppP = DexAmmProtocol.load(DPPFactory_ADDRESS);
  let dspP = DexAmmProtocol.load(DSPFactory_ADDRESS);

  let name = "";

  if (!protocol) {
    protocol = new DexAmmProtocol(proto);
    if (proto == DVMFactory_ADDRESS) {
      name = "DODO V2 - DVM Factory";
    } else if (proto == CPFactory_ADDRESS) {
      name = "DODO V2 - CrowdPool Factory";
    } else if (proto == DPPFactory_ADDRESS) {
      name = "DODO V2 - DPP Factory";
    } else if (proto == DSPFactory_ADDRESS) {
      name = "DODO V2 - DSP Factory";
    }
    protocol.name = name;
    protocol.slug = "messari-dodo";
    protocol.schemaVersion = "1.2.0";
    protocol.subgraphVersion = "0.2.1";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = ZERO_BD;
    protocol.protocolControlledValueUSD = ZERO_BD;
    protocol.cumulativeVolumeUSD = ZERO_BD;
    protocol.cumulativeSupplySideRevenueUSD = ZERO_BD;
    protocol.cumulativeProtocolSideRevenueUSD = ZERO_BD;
    protocol.cumulativeTotalRevenueUSD = ZERO_BD;
    protocol.cumulativeUniqueUsers = 0;

    protocol.save();
  }
  return protocol;
}

export function getOrCreatePool(
  poolAddress: Address,
  baseAdd: Address,
  quoteAdd: Address,
  timestamp: BigInt,
  blockNumber: BigInt
): LiquidityPool {
  let dodo = getOrCreateDexAmm(poolAddress);
  let pool = LiquidityPool.load(poolAddress.toHex());
  let it = getOrCreateToken(baseAdd);
  let ot = getOrCreateToken(quoteAdd);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));
  let lpToken = getOrCreateToken(poolAddress);

  if (!pool) {
    pool = new LiquidityPool(poolAddress.toHex());
    pool.protocol = dodo.id;
    pool.name = fetchTokenName(poolAddress);
    pool.symbol = fetchTokenSymbol(poolAddress);
    pool.inputTokens = [it.id, ot.id];
    pool.outputToken = lpToken.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.cumulativeVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI, ZERO_BI];
    pool.inputTokenWeights = [
      BigDecimal.fromString("0.5"),
      BigDecimal.fromString("0.5")
    ];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.stakedOutputTokenAmount = ZERO_BI;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = timestamp;
    pool.createdBlockNumber = blockNumber;
    pool.save();
  }
  return pool;
}

export function getOrCreateDailyUsageSnapshot(
  event: ethereum.Event,
  prevCount: i32
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getProtocolFromPool(event.address);

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = prevCount;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateHourlyUsageSnapshot(
  event: ethereum.Event,
  prevCount: i32
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getProtocolFromPool(event.address);

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = prevCount;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancials(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getProtocolFromPool(event.address);
    financialMetrics.totalValueLockedUSD = ZERO_BD;
    financialMetrics.protocolControlledValueUSD = ZERO_BD;
    financialMetrics.dailyVolumeUSD = ZERO_BD;
    financialMetrics.cumulativeVolumeUSD = ZERO_BD;
    financialMetrics.dailySupplySideRevenueUSD = ZERO_BD;
    financialMetrics.cumulativeSupplySideRevenueUSD = ZERO_BD;
    financialMetrics.dailyProtocolSideRevenueUSD = ZERO_BD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = ZERO_BD;
    financialMetrics.dailyTotalRevenueUSD = ZERO_BD;
    financialMetrics.cumulativeTotalRevenueUSD = ZERO_BD;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreatePoolDailySnapshot(
  event: ethereum.Event
): LiquidityPoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    poolAddress.concat("-").concat(id.toString())
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      poolAddress.concat("-").concat(id.toString())
    );

    let pool = getOrCreatePool(
      event.address,
      event.address,
      event.address,
      event.block.number,
      event.block.timestamp
    );

    poolMetrics.protocol = getProtocolFromPool(event.address);
    poolMetrics.pool = pool.id;
    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.totalValueLockedUSD = BigDecimal.fromString("0");
    poolMetrics.dailyVolumeUSD = BigDecimal.fromString("0");
    poolMetrics.dailyVolumeByTokenAmount = [];
    poolMetrics.dailyVolumeByTokenUSD = [];
    poolMetrics.cumulativeVolumeUSD = BigDecimal.fromString("0");
    poolMetrics.inputTokenBalances = [];
    poolMetrics.inputTokenWeights = [];
    poolMetrics.outputTokenSupply = ZERO_BI;
    poolMetrics.outputTokenPriceUSD = BigDecimal.fromString("0");
    poolMetrics.stakedOutputTokenAmount = ZERO_BI;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getLiquidityPoolHourlySnapshot(
  event: ethereum.Event
): LiquidityPoolHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let poolAddress = event.address.toHexString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    poolAddress.concat("-").concat(id.toString())
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      poolAddress.concat("-").concat(id.toString())
    );

    let pool = getOrCreatePool(
      event.address,
      event.address,
      event.address,
      event.block.number,
      event.block.timestamp
    );

    setPriceLP(event.block.timestamp, event.block.number, event.address);
    poolMetrics.protocol = getProtocolFromPool(event.address);
    poolMetrics.pool = pool.id;
    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.totalValueLockedUSD = BigDecimal.fromString("0");
    poolMetrics.dailyVolumeUSD = BigDecimal.fromString("0");
    poolMetrics.dailyVolumeByTokenAmount = [];
    poolMetrics.dailyVolumeByTokenUSD = [];
    poolMetrics.cumulativeVolumeUSD = BigDecimal.fromString("0");
    poolMetrics.inputTokenBalances = [];
    poolMetrics.inputTokenWeights = [];
    poolMetrics.outputTokenSupply = ZERO_BI;
    poolMetrics.outputTokenPriceUSD = BigDecimal.fromString("0");
    poolMetrics.stakedOutputTokenAmount = ZERO_BI;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

function getProtocolFromPool(poolAddress: Address): string {
  let pool = DVM.bind(poolAddress);
  let callResult = pool.try_version();
  let version = "";

  if (callResult.reverted) {
    log.info("pool get version reverted", []);
  } else {
    version = callResult.value;
    log.info("pool get version returned", [version]);
  }

  let factoryAdd = "";
  if (
    version == "DVM 1.0.0" ||
    version == "DVM 1.0.1" ||
    version == "DVM 1.0.2"
  ) {
    factoryAdd = DVMFactory_ADDRESS;
  } else if (version == "DPP 1.0.0") {
    factoryAdd = DPPFactory_ADDRESS;
  } else if (version == "DSP 1.0.0" || version == "DSP 1.0.1") {
    factoryAdd = DSPFactory_ADDRESS;
  } else {
    factoryAdd = CPFactory_ADDRESS;
  }
  return factoryAdd;
}

export function getUSDprice(tokenAddress: Address, amount: BigInt): BigDecimal {
  let token = getOrCreateToken(tokenAddress);
  //get last price
  let lastprice = token.lastPriceUSD;
  //dont know why but it insists lastprice can be empty even tho there is no way it can
  if (!lastprice) {
    lastprice = ZERO_BD;
  }
  //usd price amount of tokens
  let price = bigIntToBigDecimal(amount) * lastprice;
  return price;
}
