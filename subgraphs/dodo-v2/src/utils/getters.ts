// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal, calculateAverage } from "./numbers";

import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  RewardToken
} from "../../generated/schema";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

import {
  ZERO_BD,
  ZERO_BI,
  Network,
  ProtocolType,
  RewardTokenType,
  SECONDS_PER_DAY,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS
} from "./constants";
import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/ERC20/ERC20";

import { DVMFactory } from "../../generated/DVMFactory/DVMFactory";
import { CrowdPoolingFactory } from "../../generated/CrowdPoolingFactory/CrowdPoolingFactory";
import { DSPFactory } from "../../generated/DSPFactory/DSPFactory";
import { DPPFactory } from "../../generated/DPPFactory/DPPFactory";
import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";

let STABLE_COINS: string[] = [
  "0x6b175474e89094c44da98b954eedeac495271d0f", // dai
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // usdc
  "0xdac17f958d2ee523a2206206994597c13d831ec7" // usdt
];

let FACTORIES: string[] = [
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS
];

export function getOrCreateRewardToken(rewardToken: Address): RewardToken {
  let token = RewardToken.load(rewardToken.toHexString());
  // fetch info if null
  if (!token) {
    token = new RewardToken(rewardToken.toHexString());
    token.symbol = fetchTokenSymbol(rewardToken);
    token.name = fetchTokenName(rewardToken);
    token.decimals = fetchTokenDecimals(rewardToken);
    token.type = RewardTokenType.DEPOSIT;
    token.save();
  }
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
    token.save();
  }
  return token;
}

export function getOrCreateDexAmm(factoryAddress: Address): DexAmmProtocol {
  let proto = getProtocolFromPool(factoryAddress);
  let protocol = DexAmmProtocol.load(proto);

  if (!protocol) {
    protocol = new DexAmmProtocol(proto);
    protocol.name = "DODO V2";
    protocol.slug = "messari-dodo";
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = ZERO_BD;

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
    pool.inputTokens = [it.id, ot.id];
    pool.outputToken = lpToken.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = timestamp;
    pool.createdBlockNumber = blockNumber;
    pool.save();
  }
  return pool;
}

export function getOrCreateUsageMetricSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getProtocolFromPool(event.address);

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
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

    financialMetrics.feesUSD = ZERO_BD;
    financialMetrics.totalVolumeUSD = ZERO_BD;
    financialMetrics.totalValueLockedUSD = ZERO_BD;
    financialMetrics.supplySideRevenueUSD = ZERO_BD;
    financialMetrics.protocolSideRevenueUSD = ZERO_BD;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreatePoolDailySnapshot(
  event: ethereum.Event
): PoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = PoolDailySnapshot.load(
    poolAddress.concat("-").concat(id.toString())
  );

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(
      poolAddress.concat("-").concat(id.toString())
    );

    poolMetrics.protocol = getProtocolFromPool(event.address);
    poolMetrics.pool = poolAddress;
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
  }

  let factoryAdd = "";
  if (version == "DVM 1.0.2") {
    factoryAdd = DVMFactory_ADDRESS;
  } else if (version == "CP 1.0.0") {
    factoryAdd = CPFactory_ADDRESS;
  } else if (version == "DPP 1.0.0") {
    factoryAdd = DPPFactory_ADDRESS;
  } else if (version == "DSP 1.0.1") {
    factoryAdd = DSPFactory_ADDRESS;
  }
  return factoryAdd;
}

export function getTokenAmountPriceAv(
  trader: Address,
  tokenAddress: Address,
  amount: BigInt
): BigDecimal {
  let dvmFactory = DVMFactory.bind(Address.fromString(DVMFactory_ADDRESS));
  // let cpFactory = DVMFactory.bind(Address.fromString(CPFactory_ADDRESS));
  // let dppFactory = DVMFactory.bind(Address.fromString(DPPFactory_ADDRESS));
  // let dspFactory = DVMFactory.bind(Address.fromString(DSPFactory_ADDRESS));
  //
  let total = [BigDecimal.fromString("0")];

  for (let i = 0; i <= 2; i++) {
    let add = STABLE_COINS[i];
    //   ////////////////
    let callResult1 = dvmFactory.try_getDODOPool(
      Address.fromString(add),
      tokenAddress
    );

    let dvmPoolAdd: Address[] = [];
    if (callResult1.reverted) {
      log.info("DVM getDODOPool reverted", []);
      return ZERO_BD;
    } else {
      dvmPoolAdd = callResult1.value;
    }
    //   // ////////////////
    //   // let callResult2 = cpFactory.try_getDODOPool(
    //   //   Address.fromString(add),
    //   //   tokenAddress
    //   // );
    //   // if (callResult2.reverted) {
    //   //   log.info("CrowdPool getDODOPool reverted", []);
    //   //   return ZERO_BD;
    //   // } else {
    //   //   cpPoolAdd = callResult2.value;
    //   // }
    //   // ////////////////
    //   // let callResult3 = dppFactory.try_getDODOPool(
    //   //   Address.fromString(add),
    //   //   tokenAddress
    //   // );
    //   // if (callResult3.reverted) {
    //   //   log.info("DPP getDODOPool reverted", []);
    //   //   return ZERO_BD;
    //   // } else {
    //   //   dppPoolAdd = callResult3.value;
    //   // }
    //   // ////////////////
    //   // let callResult4 = dspFactory.try_getDODOPool(
    //   //   Address.fromString(add),
    //   //   tokenAddress
    //   // );
    //   // if (callResult4.reverted) {
    //   //   log.info("DSP getDODOPool reverted", []);
    //   //   return ZERO_BD;
    //   // } else {
    //   //   let dspPoolAdd = callResult4.value;
    //   // }
    //   //   ////////////////
    let padd = dvmPoolAdd[0];

    log.info("DVM POOL ADDRESS SET AS: {}", [padd.toString()]);
    let dvm = DVM.bind(padd);
    //  let callResult5 = dvm.try_querySellQuote(trader, amount);
    // let vaultTotal = [ZERO_BD];
    // if (callResult5.reverted) {
    //   log.info("DVM QuerySellQuote reverted", []);
    //   return ZERO_BD;
    // } else {
    //   let num = bigIntToBigDecimal(
    //     callResult5.value.value0 + callResult5.value.value1
    //   );
    //   vaultTotal.push(num);
    // }
    //   //
    //   //   // let cp = CP.bind(cpPoolAdd[0]);
    //   //   // let vaultReserveCP = cp.querySellQuote(trader, amount);
    //   //   // vaultTotal = vaultTotal + vaultReserveCP.value0 + vaultReserveCP.value1;
    //   //
    //   //   // let dpp = DPP.bind(dppPoolAdd[0]);
    //   //   // let vaultReserveDPP = dpp.querySellQuote(trader, amount);
    //   //   // vaultTotal = vaultTotal + vaultReserveDPP.value0 + vaultReserveDPP.value1;
    //   //   //
    //   //   // let dsp = DSP.bind(dspPoolAdd[0]);
    //   //   // let vaultReserveDSP = dsp.querySellQuote(trader, amount);
    //   //   // vaultTotal = vaultTotal + vaultReserveDSP.value0 + vaultReserveDSP.value1;
    //   //
    //   total.push(calculateAverage(vaultTotal));
    // }
    // //
    // return calculateAverage(total);
  }
  return ZERO_BD;
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}
