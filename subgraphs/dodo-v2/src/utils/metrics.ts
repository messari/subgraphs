import {
  BigDecimal,
  Address,
  ethereum,
  BigInt,
  log
} from "@graphprotocol/graph-ts";

import {
  _Account,
  _DailyActiveAccount,
  LiquidityPoolFee
} from "../../generated/schema";

import {
  SECONDS_PER_DAY,
  ADDRESS_ZERO,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  STABLE_COINS,
  FEE_MODEL_INSTANCE,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS
} from "../constants/constant";

import { bigIntToBigDecimal } from "./numbers";

import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getLiquidityPoolHourlySnapshot,
  getOrCreateDailyUsageSnapshot,
  getOrCreateHourlyUsageSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getOrCreateToken,
  getUSDprice
} from "./getters";

import {
  setUSDprice,
  setUSDpriceTokenToToken,
  setPriceLP,
  createSwap
} from "./setters";

import { ERC20 } from "../../generated/DVMFactory/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { DSP } from "../../generated/DSP/DSP";
import { FeeRateModel } from "../../generated/DVMFactory/FeeRateModel";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  event: ethereum.Event,
  usdTVL: BigDecimal,
  usdTVolume: BigDecimal,
  feesArray: BigDecimal[]
): void {
  let protocol = getOrCreateDexAmm(event.address);

  let dvmP = getOrCreateDexAmm(Address.fromString(DVMFactory_ADDRESS));
  let cpP = getOrCreateDexAmm(Address.fromString(CPFactory_ADDRESS));
  let dppP = getOrCreateDexAmm(Address.fromString(DPPFactory_ADDRESS));
  let dspP = getOrCreateDexAmm(Address.fromString(DSPFactory_ADDRESS));

  let dvmCumulativeSupplySideRevenueUSD = dvmP.cumulativeSupplySideRevenueUSD;
  let dvmCumulativeProtocolSideRevenueUSD =
    dvmP.cumulativeProtocolSideRevenueUSD;
  let dvmCumulativeTotalRevenueUSD = dvmP.cumulativeTotalRevenueUSD;
  let dvmCumulativeVolumeUSD = dvmP.cumulativeVolumeUSD;

  let cpCumulativeSupplySideRevenueUSD = cpP.cumulativeSupplySideRevenueUSD;
  let cpCumulativeProtocolSideRevenueUSD = cpP.cumulativeProtocolSideRevenueUSD;
  let cpCumulativeTotalRevenueUSD = cpP.cumulativeTotalRevenueUSD;
  let cpCumulativeVolumeUSD = cpP.cumulativeVolumeUSD;

  let dppCumulativeSupplySideRevenueUSD = dppP.cumulativeSupplySideRevenueUSD;
  let dppCumulativeProtocolSideRevenueUSD =
    dppP.cumulativeProtocolSideRevenueUSD;
  let dppCumulativeTotalRevenueUSD = dppP.cumulativeTotalRevenueUSD;
  let dppCumulativeVolumeUSD = dppP.cumulativeVolumeUSD;

  let dspCumulativeSupplySideRevenueUSD = dspP.cumulativeSupplySideRevenueUSD;
  let dspCumulativeProtocolSideRevenueUSD =
    dspP.cumulativeProtocolSideRevenueUSD;
  let dspCumulativeTotalRevenueUSD = dspP.cumulativeTotalRevenueUSD;
  let dspCumulativeVolumeUSD = dspP.cumulativeVolumeUSD;

  let prevCumulativeSupplySideRevenueUSD = ZERO_BD;
  let prevCumulativeProtocolSideRevenueUSD = ZERO_BD;
  let prevCumulativeTotalRevenueUSD = ZERO_BD;
  let prevCumulativeVolumeUSD = ZERO_BD;

  //if DVM is biggest
  if (
    dvmCumulativeSupplySideRevenueUSD > cpCumulativeSupplySideRevenueUSD &&
    dvmCumulativeSupplySideRevenueUSD > dppCumulativeSupplySideRevenueUSD &&
    dvmCumulativeSupplySideRevenueUSD > dspCumulativeSupplySideRevenueUSD
  ) {
    prevCumulativeSupplySideRevenueUSD = dvmCumulativeSupplySideRevenueUSD;
  }

  if (
    dvmCumulativeProtocolSideRevenueUSD > cpCumulativeProtocolSideRevenueUSD &&
    dvmCumulativeProtocolSideRevenueUSD > dppCumulativeProtocolSideRevenueUSD &&
    dvmCumulativeProtocolSideRevenueUSD > dspCumulativeProtocolSideRevenueUSD
  ) {
    prevCumulativeProtocolSideRevenueUSD = dvmCumulativeProtocolSideRevenueUSD;
  }

  if (
    dvmCumulativeTotalRevenueUSD > cpCumulativeTotalRevenueUSD &&
    dvmCumulativeTotalRevenueUSD > dppCumulativeTotalRevenueUSD &&
    dvmCumulativeTotalRevenueUSD > dspCumulativeTotalRevenueUSD
  ) {
    prevCumulativeTotalRevenueUSD = dvmCumulativeTotalRevenueUSD;
  }

  if (
    dvmCumulativeVolumeUSD > cpCumulativeVolumeUSD &&
    dvmCumulativeVolumeUSD > dppCumulativeVolumeUSD &&
    dvmCumulativeVolumeUSD > dspCumulativeVolumeUSD
  ) {
    prevCumulativeVolumeUSD = dvmCumulativeVolumeUSD;
  }
  //if CP is biggest

  if (
    cpCumulativeSupplySideRevenueUSD > dvmCumulativeSupplySideRevenueUSD &&
    cpCumulativeSupplySideRevenueUSD > dppCumulativeSupplySideRevenueUSD &&
    cpCumulativeSupplySideRevenueUSD > dspCumulativeSupplySideRevenueUSD
  ) {
    prevCumulativeSupplySideRevenueUSD = cpCumulativeSupplySideRevenueUSD;
  }

  if (
    cpCumulativeProtocolSideRevenueUSD > dvmCumulativeProtocolSideRevenueUSD &&
    cpCumulativeProtocolSideRevenueUSD > dppCumulativeProtocolSideRevenueUSD &&
    cpCumulativeProtocolSideRevenueUSD > dspCumulativeProtocolSideRevenueUSD
  ) {
    prevCumulativeProtocolSideRevenueUSD = cpCumulativeProtocolSideRevenueUSD;
  }

  if (
    cpCumulativeTotalRevenueUSD > dvmCumulativeTotalRevenueUSD &&
    cpCumulativeTotalRevenueUSD > dppCumulativeTotalRevenueUSD &&
    cpCumulativeTotalRevenueUSD > dspCumulativeTotalRevenueUSD
  ) {
    prevCumulativeTotalRevenueUSD = cpCumulativeTotalRevenueUSD;
  }

  if (
    cpCumulativeVolumeUSD > dvmCumulativeVolumeUSD &&
    cpCumulativeVolumeUSD > dppCumulativeVolumeUSD &&
    cpCumulativeVolumeUSD > dspCumulativeVolumeUSD
  ) {
    prevCumulativeVolumeUSD = cpCumulativeVolumeUSD;
  }
  //if DPP is biggest

  if (
    dppCumulativeSupplySideRevenueUSD > dvmCumulativeSupplySideRevenueUSD &&
    dppCumulativeSupplySideRevenueUSD > cpCumulativeSupplySideRevenueUSD &&
    dppCumulativeSupplySideRevenueUSD > dspCumulativeSupplySideRevenueUSD
  ) {
    prevCumulativeSupplySideRevenueUSD = dppCumulativeSupplySideRevenueUSD;
  }

  if (
    dppCumulativeProtocolSideRevenueUSD > cpCumulativeProtocolSideRevenueUSD &&
    dppCumulativeProtocolSideRevenueUSD > dvmCumulativeProtocolSideRevenueUSD &&
    dppCumulativeProtocolSideRevenueUSD > dspCumulativeProtocolSideRevenueUSD
  ) {
    prevCumulativeProtocolSideRevenueUSD = dppCumulativeProtocolSideRevenueUSD;
  }

  if (
    dppCumulativeTotalRevenueUSD > cpCumulativeTotalRevenueUSD &&
    dppCumulativeTotalRevenueUSD > dvmCumulativeTotalRevenueUSD &&
    dppCumulativeTotalRevenueUSD > dspCumulativeTotalRevenueUSD
  ) {
    prevCumulativeTotalRevenueUSD = dppCumulativeTotalRevenueUSD;
  }

  if (
    dppCumulativeVolumeUSD > cpCumulativeVolumeUSD &&
    dppCumulativeVolumeUSD > dvmCumulativeVolumeUSD &&
    dppCumulativeVolumeUSD > dspCumulativeVolumeUSD
  ) {
    prevCumulativeVolumeUSD = dppCumulativeVolumeUSD;
  }
  //if DSP is biggest

  if (
    dspCumulativeSupplySideRevenueUSD > dvmCumulativeSupplySideRevenueUSD &&
    dspCumulativeSupplySideRevenueUSD > cpCumulativeSupplySideRevenueUSD &&
    dspCumulativeSupplySideRevenueUSD > dppCumulativeSupplySideRevenueUSD
  ) {
    prevCumulativeSupplySideRevenueUSD = dspCumulativeSupplySideRevenueUSD;
  }

  if (
    dspCumulativeProtocolSideRevenueUSD > cpCumulativeProtocolSideRevenueUSD &&
    dspCumulativeProtocolSideRevenueUSD > dppCumulativeProtocolSideRevenueUSD &&
    dspCumulativeProtocolSideRevenueUSD > dvmCumulativeProtocolSideRevenueUSD
  ) {
    prevCumulativeProtocolSideRevenueUSD = dspCumulativeProtocolSideRevenueUSD;
  }

  if (
    dspCumulativeTotalRevenueUSD > cpCumulativeTotalRevenueUSD &&
    dspCumulativeTotalRevenueUSD > dppCumulativeTotalRevenueUSD &&
    dspCumulativeTotalRevenueUSD > dvmCumulativeTotalRevenueUSD
  ) {
    prevCumulativeTotalRevenueUSD = dspCumulativeTotalRevenueUSD;
  }

  if (
    dspCumulativeVolumeUSD > cpCumulativeVolumeUSD &&
    dspCumulativeVolumeUSD > dppCumulativeVolumeUSD &&
    dspCumulativeVolumeUSD > dvmCumulativeVolumeUSD
  ) {
    prevCumulativeVolumeUSD = dspCumulativeVolumeUSD;
  }

  let usdValFees = feesArray[0];
  let lpMTRatio = feesArray[1];

  let usdValLP = usdValFees * lpMTRatio;
  let usdValMT = usdValFees - usdValLP;

  prevCumulativeSupplySideRevenueUSD += usdValLP;
  prevCumulativeProtocolSideRevenueUSD += usdValMT;
  prevCumulativeTotalRevenueUSD += usdValLP + usdValMT;
  prevCumulativeVolumeUSD += usdTVolume;
  protocol.totalValueLockedUSD += usdTVL;
  protocol.protocolControlledValueUSD += usdTVL;

  protocol.cumulativeSupplySideRevenueUSD = prevCumulativeSupplySideRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD = prevCumulativeProtocolSideRevenueUSD;
  protocol.cumulativeTotalRevenueUSD = prevCumulativeTotalRevenueUSD;
  protocol.cumulativeVolumeUSD = prevCumulativeVolumeUSD;

  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.protocol = protocol.id;

  financialMetrics.cumulativeVolumeUSD += protocol.cumulativeVolumeUSD;
  financialMetrics.totalValueLockedUSD += usdTVL;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
  protocol.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  isD: bool,
  isW: bool
): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateDexAmm(event.address);

  let dvmP = getOrCreateDexAmm(Address.fromString(DVMFactory_ADDRESS));
  let cpP = getOrCreateDexAmm(Address.fromString(CPFactory_ADDRESS));
  let dppP = getOrCreateDexAmm(Address.fromString(DPPFactory_ADDRESS));
  let dspP = getOrCreateDexAmm(Address.fromString(DSPFactory_ADDRESS));

  let dvmCumulativeUniqueUsers = dvmP.cumulativeUniqueUsers;
  let cpCumulativeUniqueUsers = cpP.cumulativeUniqueUsers;
  let dppCumulativeUniqueUsers = dppP.cumulativeUniqueUsers;
  let dspCumulativeUniqueUsers = dspP.cumulativeUniqueUsers;

  let prevCumulativeUniqueUsers = 0;

  //if DVM is biggest
  if (
    dvmCumulativeUniqueUsers > cpCumulativeUniqueUsers &&
    dvmCumulativeUniqueUsers > dppCumulativeUniqueUsers &&
    dvmCumulativeUniqueUsers > dspCumulativeUniqueUsers
  ) {
    prevCumulativeUniqueUsers = dvmCumulativeUniqueUsers;
  }

  //if CP is biggest
  if (
    cpCumulativeUniqueUsers > dvmCumulativeUniqueUsers &&
    cpCumulativeUniqueUsers > dppCumulativeUniqueUsers &&
    cpCumulativeUniqueUsers > dspCumulativeUniqueUsers
  ) {
    prevCumulativeUniqueUsers = cpCumulativeUniqueUsers;
  }

  //if DPP is biggest
  if (
    dppCumulativeUniqueUsers > cpCumulativeUniqueUsers &&
    dppCumulativeUniqueUsers > dvmCumulativeUniqueUsers &&
    dppCumulativeUniqueUsers > dspCumulativeUniqueUsers
  ) {
    prevCumulativeUniqueUsers = dppCumulativeUniqueUsers;
  }

  //if DSP is biggest
  if (
    dspCumulativeUniqueUsers > cpCumulativeUniqueUsers &&
    dspCumulativeUniqueUsers > dppCumulativeUniqueUsers &&
    dspCumulativeUniqueUsers > dvmCumulativeUniqueUsers
  ) {
    prevCumulativeUniqueUsers = dspCumulativeUniqueUsers;
  }

  prevCumulativeUniqueUsers += 1;

  if (!account) {
    account = new _Account(accountId);
    account.save();
    protocol.cumulativeUniqueUsers = prevCumulativeUniqueUsers;
    protocol.save();
  }

  let usageMetricsDaily = getOrCreateDailyUsageSnapshot(
    event,
    protocol.cumulativeUniqueUsers
  );
  let usageMetricsHourly = getOrCreateHourlyUsageSnapshot(
    event,
    protocol.cumulativeUniqueUsers
  );

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsDaily.dailyActiveUsers += 1;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += 1;
  usageMetricsHourly.hourlyActiveUsers += 1;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
  }

  if (isD) {
    usageMetricsDaily.dailyDepositCount += 1;
    usageMetricsHourly.hourlyDepositCount += 1;
  }
  if (isW) {
    usageMetricsDaily.dailyWithdrawCount += 1;
    usageMetricsHourly.hourlyWithdrawCount += 1;
  }
  if (!isD && !isW) {
    usageMetricsDaily.dailySwapCount += 1;
    usageMetricsHourly.hourlySwapCount += 1;
  }
  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(
  event: ethereum.Event,
  poolAdd: Address,
  tokenAdds: Address[],
  trader: Address,
  amount: BigInt[]
): void {
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);

  let protocol = getOrCreateDexAmm(event.address);

  let token1 = ERC20.bind(tokenAdds[0]);
  let token2 = ERC20.bind(tokenAdds[1]);

  let t1 = getOrCreateToken(tokenAdds[0]);
  let t2 = getOrCreateToken(tokenAdds[1]);

  let lpToken = ERC20.bind(Address.fromString(pool.outputToken));

  let poolInstance = DVM.bind(poolAdd);

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    return;
  }

  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    return;
  }

  let lpSupply = poolInstance.try_totalSupply();
  if (lpSupply.reverted) {
    return;
  }

  //check to see if either token in the transaction is a stablecoin(DAI, USDC, USDT)
  //If either tokens are call the setUSDprice function to set a price for the other token
  if (
    tokenAdds[0] == Address.fromString(STABLE_COINS[0]) ||
    tokenAdds[0] == Address.fromString(STABLE_COINS[1]) ||
    tokenAdds[0] == Address.fromString(STABLE_COINS[2])
  ) {
    setUSDprice(event, tokenAdds[1], amount[1], tokenAdds[0], amount[0]);
  }
  if (
    tokenAdds[1] == Address.fromString(STABLE_COINS[0]) ||
    tokenAdds[1] == Address.fromString(STABLE_COINS[1]) ||
    tokenAdds[1] == Address.fromString(STABLE_COINS[2])
  ) {
    setUSDprice(event, tokenAdds[0], amount[0], tokenAdds[1], amount[1]);
  }
  if (t1.lastPriceUSD > BigDecimal.fromString("0")) {
    setUSDpriceTokenToToken(
      event,
      tokenAdds[0],
      tokenAdds[1],
      amount[0],
      amount[1]
    );
  } else if (t2.lastPriceUSD > BigDecimal.fromString("0")) {
    setUSDpriceTokenToToken(
      event,
      tokenAdds[1],
      tokenAdds[0],
      amount[1],
      amount[0]
    );
  }

  let usdValueOfTransaction: BigDecimal = BigDecimal.fromString("0");

  usdValueOfTransaction = getUSDprice(tokenAdds[0], amount[0]);

  let usdValueOfToken1 = getUSDprice(tokenAdds[0], tokenBal1.value);
  let usdValueOfToken2 = getUSDprice(tokenAdds[1], tokenBal2.value);
  let usdValofPool = usdValueOfToken1 + usdValueOfToken2;
  let lpTokenUSD = getUSDprice(
    Address.fromString(pool.outputToken),
    BigInt.fromString("1000000000000000000")
  );

  pool.cumulativeVolumeUSD += usdValueOfTransaction;
  pool.totalValueLockedUSD = usdValofPool;
  poolMetrics.totalValueLockedUSD = usdValofPool;
  poolMetrics.cumulativeVolumeUSD += usdValueOfTransaction;
  poolMetrics.inputTokenBalances = [tokenBal1.value, tokenBal2.value];
  poolMetrics.outputTokenSupply = lpSupply.value;
  poolMetrics.outputTokenPriceUSD = lpTokenUSD;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  let feesArray = updateFees(event, poolAdd, usdValueOfTransaction, trader);
  updateFinancials(event, usdValofPool, usdValueOfTransaction, feesArray);
  setPriceLP(event.block.timestamp, event.block.number, poolAdd);
  poolMetrics.save();
  pool.save();
}

export function updateFees(
  event: ethereum.Event,
  poolAdd: Address,
  usdValOfTrade: BigDecimal,
  trader: Address
): BigDecimal[] {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let poolFee = new LiquidityPoolFee(id.toString());
  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);
  let poolInstance = DSP.bind(poolAdd);
  let lpmtr = BigDecimal.fromString(".25");

  let feeMInstance = FeeRateModel.bind(Address.fromString(FEE_MODEL_INSTANCE));

  let callResult1 = feeMInstance.try_feeRateImpl();
  if (callResult1.reverted) {
    log.info("feeRateImpl reverted", []);
  }
  let feeImpAdd = callResult1.value;

  let feeImpInstance = FeeRateModel.bind(feeImpAdd);

  let callResult = feeImpInstance.try_getFeeRate(poolAdd, trader);
  if (callResult.reverted) {
    log.info("getFeeRate reverted", []);
  }

  let fr = callResult.value;

  let usdValOfFees = usdValOfTrade * bigIntToBigDecimal(fr);

  poolFee.pool = pool.id;
  poolFee.feePercentage = BigDecimal.fromString("0");
  poolFee.feeType = "TIERED_TRADING_FEE";
  poolFee.usdValueOfFee = usdValOfFees;
  poolFee.lpMTRatio = lpmtr;

  return [usdValOfFees, lpmtr];
}

export function updateCPpoolMetrics(
  event: ethereum.Event,
  poolAdd: Address
): void {
  let cpPool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);
  let tokens = cpPool.inputTokens;

  let token1 = ERC20.bind(Address.fromString(tokens[0]));
  let token2 = ERC20.bind(Address.fromString(tokens[1]));

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    return;
  }

  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    return;
  }

  let amount = [tokenBal1.value, tokenBal2.value];
  let token = [Address.fromString(tokens[0]), Address.fromString(tokens[1])];

  updatePoolMetrics(
    event,
    poolAdd,
    token,
    Address.fromString(ADDRESS_ZERO),
    amount
  );

  createSwap(
    event,
    Address.fromString(ADDRESS_ZERO),
    poolAdd,
    token[0],
    token[1],
    amount[0],
    amount[1]
  );
}
