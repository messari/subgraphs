import {
  BigDecimal,
  Address,
  ethereum,
  BigInt,
  log
} from "@graphprotocol/graph-ts";

import {
  Account,
  ActiveAccount,
  LiquidityPoolFee,
  DexAmmProtocol
} from "../../generated/schema";

import {
  SECONDS_PER_DAY,
  ADDRESS_ZERO,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ONE_BD,
  STABLE_COINS,
  FEE_MODEL_INSTANCE,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  TOKEN_CREATION_FEE,
  WRAPPED_FEE_TOKEN
} from "../constants/constant";

import { bigIntToBigDecimal, modulateDecimals, safeDiv } from "./numbers";


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



import { ERC20 } from "../../generated/DVMFactory/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { DSP } from "../../generated/DSP/DSP";
import { FeeRateModel } from "../../generated/DVMFactory/FeeRateModel";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  event: ethereum.Event,
  usdTVL: BigDecimal,
  change: BigDecimal,
  gainedVal: bool,
  usdTranVal: BigDecimal,
  usdValOfFees: BigDecimal[]// 0 is mtfee, 1 is lpFee %
): void {
  let supplySideRevb4 = usdTranVal * usdValOfFees[1]
  let protoSideRevb4 = usdTranVal * usdValOfFees[0];
  let protoSideRev = protoSideRevb4 * BigDecimal.fromString(".05");
  let supplySideRev = supplySideRevb4 + (protoSideRevb4 * BigDecimal.fromString(".95"));
  let totalRev = supplySideRev + protoSideRev;
  let dvmP = getOrCreateDexAmm();
  let prevTotalValueLockedUSD = dvmP.totalValueLockedUSD;
  let newTotalValueLockedUSD = ZERO_BD;

  if(gainedVal) {
     newTotalValueLockedUSD = prevTotalValueLockedUSD + change;
  } else {
    newTotalValueLockedUSD = prevTotalValueLockedUSD - change;
  }

  dvmP.totalValueLockedUSD = newTotalValueLockedUSD;
  dvmP.protocolControlledValueUSD = ZERO_BD;
  dvmP.cumulativeSupplySideRevenueUSD += supplySideRev;
  dvmP.cumulativeProtocolSideRevenueUSD += protoSideRev;
  dvmP.cumulativeTotalRevenueUSD += totalRev;
  dvmP.cumulativeVolumeUSD += usdTranVal;
  dvmP.save();

  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.protocol = dvmP.id;
  financialMetrics.protocolControlledValueUSD = ZERO_BD;
  financialMetrics.dailyVolumeUSD += usdTVL;
  financialMetrics.dailySupplySideRevenueUSD += supplySideRev;
  financialMetrics.dailyProtocolSideRevenueUSD += protoSideRev;
  financialMetrics.dailyTotalRevenueUSD += totalRev;
  financialMetrics.cumulativeVolumeUSD = dvmP.cumulativeVolumeUSD;
  financialMetrics.totalValueLockedUSD = newTotalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    dvmP.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    dvmP.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    dvmP.cumulativeTotalRevenueUSD;
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
  let accountId = from.toHexString();
  let account = Account.load(accountId);
  let protocol = getOrCreateDexAmm();

  if (!account) {
    account = new Account(accountId);
    account.save();
    protocol.cumulativeUniqueUsers += 1;
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
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
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
  let protocol = getOrCreateDexAmm();
  let token1 = ERC20.bind(tokenAdds[0]);
  let token2 = ERC20.bind(tokenAdds[1]);
  let poolInstance = DVM.bind(poolAdd);
  let tokenBal1Val = BigInt.fromString("0");
  let tokenBal2Val = BigInt.fromString("0");
  let lpSupplyVal = BigInt.fromString("0");

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    tokenBal1Val = BigInt.fromString("0");
  } else {
    tokenBal1Val = tokenBal1.value;
  }


  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    tokenBal2Val = BigInt.fromString("0");
  } else {
    tokenBal2Val = tokenBal2.value;
  }


  let lpSupply = poolInstance.try_totalSupply();
  if (lpSupply.reverted) {
    lpSupplyVal = BigInt.fromString("0")
  } else {
    lpSupplyVal = lpSupply.value
  }
  //somehow this is returning negative values on some pools. Shouldnt be
  // possible given the logic but Added a check to attempt to fix
  if(lpSupplyVal < BigInt.fromString("0")) {
    lpSupplyVal = BigInt.fromString("0");
  }

  let lpToken = getOrCreateToken(poolAdd);

  let modLPsupply = modulateDecimals(lpSupplyVal, lpToken.decimals)
  let usdValueOfTransaction = getUSDprice(tokenAdds[0], amount[0]);
  let usdValueOfToken1 = getUSDprice(tokenAdds[0], tokenBal1Val);
  let usdValueOfToken2 = getUSDprice(tokenAdds[1], tokenBal2Val);

  let usdValofPool = usdValueOfToken1 + usdValueOfToken2;
  let usdValLp = safeDiv(usdValofPool, modLPsupply);

  let token = getOrCreateToken(poolAdd);
  token.lastPriceUSD = usdValLp;
  token.save();


  let prevCumulativeVolumeUSD = pool.totalValueLockedUSD;
  let gainedVal = false;
  let change = ZERO_BD;

  if(prevCumulativeVolumeUSD > usdValofPool) {
     change = prevCumulativeVolumeUSD - usdValofPool;
  } else {
    change = usdValofPool - prevCumulativeVolumeUSD;
    gainedVal = true;
  }

  pool.cumulativeVolumeUSD += usdValueOfTransaction;
  pool.totalValueLockedUSD = usdValofPool;
  pool.outputTokenSupply = lpSupplyVal;
  pool.outputTokenPriceUSD = usdValLp;
  poolMetrics.totalValueLockedUSD = usdValofPool;
  poolMetrics.cumulativeVolumeUSD += usdValueOfTransaction;
  poolMetrics.inputTokenBalances = [tokenBal1Val, tokenBal2Val];
  poolMetrics.outputTokenSupply = lpSupplyVal;
  poolMetrics.outputTokenPriceUSD = usdValLp;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  let usdValOfFees = updateFees(event, poolAdd, tokenAdds, amount[0], trader);
  updateFinancials(
    event,
    usdValofPool,
    change,
    gainedVal,
    usdValueOfTransaction,
    usdValOfFees
  );
  poolMetrics.save();
  pool.save();
}

export function updateFees(
  event: ethereum.Event,
  poolAdd: Address,
  tokenAdd: Address[],
  amount: BigInt,
  trader: Address
): BigDecimal[] {
  let poolFee = new LiquidityPoolFee("TIERED_TRADING_FEE --" + poolAdd.toHexString());
  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);
  let poolInstance = DVM.bind(poolAdd);
  let tradeValReceived = ZERO_BI;
  let mtFee = ZERO_BI;
  let token = getOrCreateToken(tokenAdd[0]);
  let mtFeePercentage = ZERO_BD;
  let lpFeePercentage = ZERO_BD;

   let vaultReserveDVM = poolInstance.try_querySellBase(trader, amount);
   if (vaultReserveDVM.reverted) {
     log.error("[UpdateFees] pool query reverted, tradeValReceived && mtFee was set to ZERO_BI", []);
   } else {
     let returnVal = vaultReserveDVM.value;
     tradeValReceived = returnVal.value0;
     mtFee = returnVal.value1;
     log.warning("[UpdateFees] pool query successful, pool address is: {} ", [poolAdd.toHexString()]);
     log.warning("[UpdateFees] pool query successful, amount of token traded is: {} ", [amount.toString()]);
     log.warning("[UpdateFees] pool query successful, tradeValReceived is: {} ", [tradeValReceived.toString()]);
     log.warning("[UpdateFees] pool query successful, mtFee is: {}", [mtFee.toString()]);
   }

  let call = poolInstance.try__LP_FEE_RATE_();

  if (call.reverted) {
    log.error("[UpdateFees] pool LP_FEE_RATE reverted", []);
  } else {
    lpFeePercentage = bigIntToBigDecimal(call.value);
  }

  if(mtFee > ZERO_BI) {
    let mv = bigIntToBigDecimal(tradeValReceived) + bigIntToBigDecimal(mtFee);
    let tv = mv + (mv * lpFeePercentage)
    mtFeePercentage = safeDiv(bigIntToBigDecimal(mtFee), tv)
  }

  poolFee.pool = pool.id;
  poolFee.feePercentage = mtFeePercentage + lpFeePercentage;
  poolFee.feeType = "TIERED_TRADING_FEE";

  poolFee.save();

  return [mtFeePercentage, lpFeePercentage];
}

export function updateFinancialsERC20(
    event: ethereum.Event
): void {

  let dvmP = getOrCreateDexAmm();

  let usdVal = getUSDprice(Address.fromString(WRAPPED_FEE_TOKEN), BigInt.fromString(TOKEN_CREATION_FEE));
  dvmP.cumulativeTotalRevenueUSD += usdVal;
  dvmP.save();


  let protocol = getOrCreateDexAmm();

  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.protocol = protocol.id;
  financialMetrics.dailyTotalRevenueUSD += usdVal;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}
