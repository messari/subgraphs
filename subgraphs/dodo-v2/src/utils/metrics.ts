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
  UsageMetricsDailySnapshot,
  LiquidityPool,
  LiquidityPoolFee
} from "../../generated/schema";

import {
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  SECONDS_PER_DAY,
  ADDRESS_ZERO,
  ZERO_BD,
  ONE_BI,
  STABLE_COINS,
  WRAPPED_ETH
} from "./constants";

import { bigIntToBigDecimal } from "./numbers";

import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getLiquidityPoolHourlySnapshot,
  getOrCreateDailyUsageSnapshot,
  getOrCreateHourlyUsageSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getUSDprice
} from "./getters";

import { setUSDprice, setUSDpriceWETH, setPriceLP } from "./setters";

import { ERC20 } from "../../generated/CP/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";
import { FeeRateModel } from "../../generated/CP/FeeRateModel";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  event: ethereum.Event,
  usdTVL: BigDecimal,
  usdTVolume: BigDecimal,
  feesArray: BigDecimal[]
): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateDexAmm(event.address);

  let usdValFees = feesArray[0];
  let lpMTRatio = feesArray[1];

  let usdValLP = usdValFees * lpMTRatio;
  let usdValMT = usdValFees - usdValLP;

  financialMetrics.protocol = protocol.id;
  let previousVL = financialMetrics.totalValueLockedUSD;
  financialMetrics.totalValueLockedUSD = previousVL + usdTVL;
  let tVolume = financialMetrics.cumulativeVolumeUSD;
  financialMetrics.cumulativeVolumeUSD = tVolume + usdTVolume;

  let previouspsr = financialMetrics.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = previouspsr + usdValLP;
  let previousssr = financialMetrics.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = previousssr + usdValMT;

  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  isD: bool,
  isW: bool
): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetricsDaily = getOrCreateDailyUsageSnapshot(event);
  let usageMetricsHourly = getOrCreateHourlyUsageSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateDexAmm(event.address);
  if (!account) {
    account = new _Account(accountId);
    account.save();
    usageMetricsDaily.cumulativeUniqueUsers += 1;
    usageMetricsHourly.cumulativeUniqueUsers += 1;
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

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

  //check if either token is wETH and if so set current USD price through wETH
  if (tokenAdds[0] == Address.fromString(WRAPPED_ETH)) {
    setUSDpriceWETH(event, tokenAdds[1], trader, amount[1], amount[0]);
  }

  if (tokenAdds[1] == Address.fromString(WRAPPED_ETH)) {
    setUSDpriceWETH(event, tokenAdds[0], trader, amount[0], amount[1]);
  }

  let usdValueOfTransaction: BigDecimal = BigDecimal.fromString("0");

  usdValueOfTransaction = getUSDprice(tokenAdds[0], amount[0]);
  log.info("this is the USD value returned: {} ", [
    usdValueOfTransaction.toString()
  ]);

  let usdValueOfToken1 = getUSDprice(tokenAdds[0], tokenBal1.value);
  let usdValueOfToken2 = getUSDprice(tokenAdds[1], tokenBal2.value);
  let usdValofPool = usdValueOfToken1 + usdValueOfToken2;
  let lpTokenUSD = getUSDprice(
    Address.fromString(pool.outputToken),
    BigInt.fromString("1000000000000000000")
  );

  let tvUSD = pool.cumulativeVolumeUSD.plus(usdValueOfTransaction);
  poolMetrics.totalValueLockedUSD = usdValofPool;
  poolMetrics.cumulativeVolumeUSD = tvUSD;
  poolMetrics.inputTokenBalances = [tokenBal1.value, tokenBal2.value];
  poolMetrics.outputTokenSupply = lpSupply.value;
  poolMetrics.outputTokenPriceUSD = lpTokenUSD;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  let feesArray = updateFees(event, poolAdd, usdValueOfTransaction, trader);
  updateFinancials(event, usdValofPool, tvUSD, feesArray);
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

  let feeMcontract = poolInstance._MT_FEE_RATE_MODEL_();
  let feeMInstance = FeeRateModel.bind(feeMcontract);
  let feeImpAdd = feeMInstance.feeRateImpl();
  let feeImpInstance = FeeRateModel.bind(feeImpAdd);
  let lpMTRatio = feeImpInstance._LP_MT_RATIO_();
  let lpmtr = BigDecimal.fromString(lpMTRatio.toString());

  let feeRate = feeMInstance.try_getFeeRate(trader);
  if (feeRate.reverted) {
    return [BigDecimal.fromString("0"), BigDecimal.fromString("0")];
  }

  let fr = feeRate.value;
  let usdValOfFees = usdValOfTrade * BigDecimal.fromString("fr");

  poolFee.pool = pool.id;
  poolFee.feePercentage = BigDecimal.fromString("0");
  poolFee.feeType = "TIERED_TRADING_FEE";
  poolFee.usdValueOfFee = usdValOfFees;
  poolFee.lpMTRatio = lpmtr;
  return [usdValOfFees, lpmtr];
}
