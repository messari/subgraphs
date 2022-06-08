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
  DSPFactory_ADDRESS
} from "../constants/constant";

import { bigIntToBigDecimal, safeDiv } from "./numbers";


import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getLiquidityPoolHourlySnapshot,
  getOrCreateDailyUsageSnapshot,
  getOrCreateHourlyUsageSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getOrCreateToken,
  getUSDprice,
  getOrCreateDexAmmADD
} from "./getters";



import { ERC20 } from "../../generated/DVMFactory/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { DSP } from "../../generated/DSP/DSP";
import { FeeRateModel } from "../../generated/DVMFactory/FeeRateModel";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  event: ethereum.Event,
  usdTVL: BigDecimal,
  usdTVolume: BigDecimal,
  usdValOfFees: BigDecimal
): void {
  let usdValLP = usdValOfFees * BigDecimal.fromString(".25");
  let usdValMT = usdValOfFees - usdValLP;

  let dvmP = getOrCreateDexAmmADD(Address.fromString(DVMFactory_ADDRESS));
  let cpP = getOrCreateDexAmmADD(Address.fromString(CPFactory_ADDRESS));
  let dppP = getOrCreateDexAmmADD(Address.fromString(DPPFactory_ADDRESS));
  let dspP = getOrCreateDexAmmADD(Address.fromString(DSPFactory_ADDRESS));

  dvmP.totalValueLockedUSD += usdTVL;
  dvmP.protocolControlledValueUSD += usdTVL;
  dvmP.cumulativeSupplySideRevenueUSD += usdValLP;
  dvmP.cumulativeProtocolSideRevenueUSD += usdValMT;
  dvmP.cumulativeTotalRevenueUSD += usdValOfFees;
  dvmP.cumulativeVolumeUSD += usdTVolume;
  dvmP.save();

  cpP.totalValueLockedUSD += usdTVL;
  cpP.protocolControlledValueUSD += usdTVL;
  cpP.cumulativeSupplySideRevenueUSD += usdValLP;
  cpP.cumulativeProtocolSideRevenueUSD += usdValMT;
  cpP.cumulativeTotalRevenueUSD += usdValOfFees;
  cpP.cumulativeVolumeUSD += usdTVolume;
  cpP.save();

  dppP.totalValueLockedUSD += usdTVL;
  dppP.protocolControlledValueUSD += usdTVL;
  dppP.cumulativeSupplySideRevenueUSD += usdValLP;
  dppP.cumulativeProtocolSideRevenueUSD += usdValMT;
  dppP.cumulativeTotalRevenueUSD += usdValOfFees;
  dppP.cumulativeVolumeUSD += usdTVolume;
  dppP.save();

  dspP.totalValueLockedUSD += usdTVL;
  dspP.protocolControlledValueUSD += usdTVL;
  dspP.cumulativeSupplySideRevenueUSD += usdValLP;
  dspP.cumulativeProtocolSideRevenueUSD += usdValMT;
  dspP.cumulativeTotalRevenueUSD += usdValOfFees;
  dspP.cumulativeVolumeUSD += usdTVolume;
  dspP.save();

  let protocol = getOrCreateDexAmm(event.address);

  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.protocol = protocol.id;

  financialMetrics.dailyVolumeUSD += usdTVL;
  financialMetrics.dailySupplySideRevenueUSD += usdValLP;
  financialMetrics.dailyProtocolSideRevenueUSD += usdValMT;
  financialMetrics.dailyTotalRevenueUSD += usdValOfFees;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
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
  let protocol = getOrCreateDexAmm(event.address);

  let dvmP = getOrCreateDexAmmADD(Address.fromString(DVMFactory_ADDRESS));
  let cpP = getOrCreateDexAmmADD(Address.fromString(CPFactory_ADDRESS));
  let dppP = getOrCreateDexAmmADD(Address.fromString(DPPFactory_ADDRESS));
  let dspP = getOrCreateDexAmmADD(Address.fromString(DSPFactory_ADDRESS));

  if (!account) {
    account = new Account(accountId);
    account.save();
    protocol.cumulativeUniqueUsers += 1;
    dvmP.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    cpP.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    dppP.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    dspP.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    protocol.save();
    dvmP.save();
    cpP.save();
    dppP.save();
    dspP.save();
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

  let protocol = getOrCreateDexAmm(event.address);

  let token1 = ERC20.bind(tokenAdds[0]);
  let token2 = ERC20.bind(tokenAdds[1]);

  let t1 = getOrCreateToken(tokenAdds[0]);
  let t2 = getOrCreateToken(tokenAdds[1]);

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

  let usdValueOfTransaction = getUSDprice(tokenAdds[0], amount[0]);
  let usdValueOfToken1 = getUSDprice(tokenAdds[0], tokenBal1Val);
  let usdValueOfToken2 = getUSDprice(tokenAdds[1], tokenBal2Val);

  let usdValofPool = usdValueOfToken1 + usdValueOfToken2;
  let lpTokenUSD = getUSDprice(
    Address.fromString(pool.outputToken),
    BigInt.fromString("1000000000000000000")
  );

  pool.cumulativeVolumeUSD += usdValueOfTransaction;
  pool.totalValueLockedUSD = usdValofPool;
  poolMetrics.totalValueLockedUSD = usdValofPool;
  poolMetrics.cumulativeVolumeUSD += usdValueOfTransaction;
  poolMetrics.inputTokenBalances = [tokenBal1Val, tokenBal2Val];
  poolMetrics.outputTokenSupply = lpSupplyVal;
  poolMetrics.outputTokenPriceUSD = lpTokenUSD;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  let usdValOfFees = updateFees(event, poolAdd, tokenAdds[0], amount[0], trader);
  updateFinancials(event, usdValofPool, usdValueOfTransaction, usdValOfFees);
  poolMetrics.save();
  pool.save();
}

export function updateFees(
  event: ethereum.Event,
  poolAdd: Address,
  tokenAdd: Address,
  amount: BigInt,
  trader: Address
): BigDecimal {
  let poolFee = new LiquidityPoolFee("TIERED_TRADING_FEE --" + poolAdd.toString());
  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, ONE_BI, ONE_BI);
  let poolInstance = DVM.bind(poolAdd);
  let tradeValReceived = ZERO_BI;
  let mtFee = ZERO_BI;


   let vaultReserveDVM = poolInstance.try_querySellBase(trader, amount);
   if (vaultReserveDVM.reverted) {
     log.warning("[UpdateFees] pool query reverted, tradeValReceived && mtFee was set to ZERO_BI", []);
   } else {
     let returnVal = vaultReserveDVM.value;
     tradeValReceived = returnVal.value0;
     mtFee = returnVal.value1;
     log.debug("[UpdateFees] pool query successful, pool address is: {} ", [poolAdd.toHexString()]);
     log.debug("[UpdateFees] pool query successful, amount of token traded is: {} ", [amount.toString()]);
     log.debug("[UpdateFees] pool query successful, tradeValReceived is: {} ", [tradeValReceived.toString()]);
     log.debug("[UpdateFees] pool query successful, mtFee are: {}", [mtFee.toString()]);
   }

  let usdValOfTrade = getUSDprice(tokenAdd, amount);
  log.debug("[UpdateFees] USD Value of amount being traded: {}", [usdValOfTrade.toString()]);
  let usdValOfFees = getUSDprice(tokenAdd, mtFee);
  log.debug("[UpdateFees] USD Value of Fees from trade is: {}", [usdValOfFees.toString()]);

  poolFee.pool = pool.id;
  poolFee.feePercentage = safeDiv(bigIntToBigDecimal(tradeValReceived), bigIntToBigDecimal(mtFee));
  poolFee.feeType = "TIERED_TRADING_FEE";

  poolFee.save();

  return usdValOfFees;
}
