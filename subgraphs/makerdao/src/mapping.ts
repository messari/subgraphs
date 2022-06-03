import { BigInt, Address, Bytes, log, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vat, LogNote } from "../generated/Vat/Vat";
import { Borrow, Deposit, Liquidate, Market, Repay, Withdraw, _Ilk } from "../generated/schema";
import {
  RAY,
  DAI,
  BIGINT_ZERO,
  RAD,
  BIGDECIMAL_ONE_HUNDRED,
  WAD,
  BIGDECIMAL_ZERO,
  MCD_VOW_ADDRESS,
  MCD_POT_ADDRESS,
} from "./common/constants";
import {
  getMarket,
  getMarketFromIlk,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateToken,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "./common/getters";
import { createMarket } from "./common/setters";
import { bigIntToBigDecimal, bytesToSignedInt, absValBigInt, absValBigDecimal } from "./common/utils/numbers";
import { getOrCreateFinancials } from "./common/getters";
import {
  updateMarketMetrics,
  updateUsageMetrics,
  updateTotalBorrowUSD,
  updateFinancialMetrics,
  updateFinancialsDailySnapshot,
} from "./common/metrics";
import { GemJoin } from "../generated/Vat/GemJoin";
import { createEntityID } from "./common/utils/strings";
import { GemJoin as GemJoinDataSource } from "../generated/templates";
import { LogNote as GemLogNote } from "../generated/templates/GemJoin/GemJoin";
import { bytesToUnsignedBigInt } from "./common/utils/numbers";

export function handleRely(event: LogNote): void {
  let marketAddress = Address.fromString(event.params.arg1.toHexString().substring(26));
  let MarketContract = GemJoin.bind(marketAddress);
  log.info("value = {}", [marketAddress.toHexString()]);
  let ilkCall = MarketContract.try_ilk(); // get ilk codename maker contracts use
  let gemCall = MarketContract.try_gem(); // get market collateral token, referred to as 'gem'
  log.info("gemCall = {}", [ilkCall.reverted.toString()]);
  if (!ilkCall.reverted && !gemCall.reverted) {
    GemJoinDataSource.create(marketAddress);
    createMarket(ilkCall.value, gemCall.value, marketAddress, event.block.number, event.block.timestamp);
  }
}

export function handleCage(event: GemLogNote): void {
  let market = getMarket(event.address.toHexString());
  if (!market){
    return
  }
  market.isActive = false;
  market.save();
}

export function handleEvent(
  event: ethereum.Event,
  market: Market,
  eventType: string,
  amountCollateral: BigInt,
  amountCollateralUSD: BigDecimal,
  amountDAI: BigInt,
): void {
  if (!market.inputToken){
    return
  }
  let protocol = getOrCreateLendingProtocol();
  let usageMetricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  let usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  if (eventType == "DEPOSIT") {

    let depositEvent = new Deposit("deposit-" + createEntityID(event));
    
    depositEvent.hash = event.transaction.hash.toHexString();
    depositEvent.logIndex = event.logIndex.toI32();
    depositEvent.protocol = protocol.id;
    depositEvent.to = market.id;
    depositEvent.from = event.transaction.from.toHexString();
    depositEvent.blockNumber = event.block.number;
    depositEvent.timestamp = event.block.timestamp;
    depositEvent.market = market.id;
    depositEvent.asset = getOrCreateToken(Address.fromString(market.inputToken!)).id;
    depositEvent.amount = absValBigInt(amountCollateral);
    depositEvent.amountUSD = absValBigDecimal(amountCollateralUSD);

    usageMetricsHourlySnapshot.hourlyDepositCount += 1;
    usageMetricsDailySnapshot.dailyDepositCount += 1;

    depositEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();

  } else if (eventType == "BORROW"){

    let borrowEvent = new Borrow("borrow-" + createEntityID(event));

    borrowEvent.hash = event.transaction.hash.toHexString();
    borrowEvent.logIndex = event.logIndex.toI32();
    borrowEvent.protocol = protocol.id;
    borrowEvent.to = market.id;
    borrowEvent.from = event.transaction.from.toHexString();
    borrowEvent.blockNumber = event.block.number;
    borrowEvent.timestamp = event.block.timestamp;
    borrowEvent.market = market.id;
    borrowEvent.asset = DAI;
    borrowEvent.amount = absValBigInt(amountDAI);
    borrowEvent.amountUSD = bigIntToBigDecimal(absValBigInt(amountDAI), WAD);

    usageMetricsHourlySnapshot.hourlyBorrowCount += 1;
    usageMetricsDailySnapshot.dailyBorrowCount += 1;

    borrowEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();

  } else if (eventType == "WITHDRAW") {

    let withdrawEvent = new Withdraw("withdraw-" + createEntityID(event));
    
    withdrawEvent.hash = event.transaction.hash.toHexString();
    withdrawEvent.logIndex = event.logIndex.toI32();
    withdrawEvent.protocol = protocol.id;
    withdrawEvent.to = market.id;
    withdrawEvent.from = event.transaction.from.toHexString();
    withdrawEvent.blockNumber = event.block.number;
    withdrawEvent.timestamp = event.block.timestamp;
    withdrawEvent.market = market.id;
    withdrawEvent.asset = getOrCreateToken(Address.fromString(market.inputToken!)).id;
    withdrawEvent.amount = absValBigInt(amountCollateral);
    withdrawEvent.amountUSD = absValBigDecimal(amountCollateralUSD);
    usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;
    usageMetricsDailySnapshot.dailyWithdrawCount += 1;

    withdrawEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();

  } else if (eventType == "REPAY") {

    let repayEvent = new Repay("repay-" + createEntityID(event));

    repayEvent.hash = event.transaction.hash.toHexString();
    repayEvent.logIndex = event.logIndex.toI32();
    repayEvent.protocol = protocol.id;
    repayEvent.to = market.id;
    repayEvent.from = event.transaction.from.toHexString();
    repayEvent.blockNumber = event.block.number;
    repayEvent.timestamp = event.block.timestamp;
    repayEvent.market = market.id;
    repayEvent.asset = DAI;
    repayEvent.amount = absValBigInt(amountDAI);
    repayEvent.amountUSD = bigIntToBigDecimal(absValBigInt(amountDAI), WAD);
    usageMetricsHourlySnapshot.hourlyRepayCount += 1;
    usageMetricsDailySnapshot.dailyRepayCount += 1;

    repayEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();

  } else if (eventType == "LIQUIDATE") {

    let liquidateEvent = new Liquidate(createEntityID(event));

    liquidateEvent.hash = event.transaction.hash.toHexString();
    liquidateEvent.logIndex = event.logIndex.toI32();
    liquidateEvent.protocol = protocol.id;
    liquidateEvent.to = market.id;
    liquidateEvent.from = event.transaction.from.toHexString();
    liquidateEvent.blockNumber = event.block.number;
    liquidateEvent.timestamp = event.block.timestamp;
    liquidateEvent.market = market.id;
    liquidateEvent.asset = getOrCreateToken(Address.fromString(market.inputToken!)).id;
    liquidateEvent.amount = absValBigInt(amountCollateral);
    liquidateEvent.amountUSD = absValBigDecimal(amountCollateralUSD);
    liquidateEvent.profitUSD = bigIntToBigDecimal(absValBigInt(amountDAI), WAD)
      .times(market.debtMultiplier)
      .times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED));

    usageMetricsHourlySnapshot.hourlyLiquidateCount += 1;
    usageMetricsDailySnapshot.dailyLiquidateCount += 1;

    liquidateEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();
  }
}

// Create or modify a Vault
export function handleFrob(event: LogNote): void {
  let ilk = event.params.arg1;
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))); // change in collateral
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196))); // change in debt
  let market = getMarketFromIlk(ilk);
  if (!market) {
    return;
  }
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  if (!marketHourlySnapshot || !marketDailySnapshot) {
    return;
  }
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let inputTokenBalance = market.inputTokenBalance.plus(dink);
  let collateralToken = getOrCreateToken(Address.fromString(market.inputToken!));
  let collateralTokenUSD = getOrCreateToken(Address.fromString(collateralToken.id)).lastPriceUSD;
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD!);
  let ΔdebtUSD = bigIntToBigDecimal(dart, WAD);

  market.inputTokenBalance = inputTokenBalance;
  market.inputTokenPriceUSD = collateralTokenUSD!;
  market.outputTokenSupply = market.outputTokenSupply.plus(dart);
  market.totalBorrowBalanceUSD = bigIntToBigDecimal(market.outputTokenSupply, WAD);
  market.totalDepositBalanceUSD = bigIntToBigDecimal(inputTokenBalance, WAD).times(collateralTokenUSD!);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  marketHourlySnapshot.hourlyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? marketHourlySnapshot.hourlyDepositUSD.plus(ΔcollateralUSD)
    : marketHourlySnapshot.hourlyDepositUSD;
  marketHourlySnapshot.hourlyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? marketHourlySnapshot.hourlyBorrowUSD.plus(ΔdebtUSD)
    : marketHourlySnapshot.hourlyBorrowUSD;

  marketDailySnapshot.dailyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? marketDailySnapshot.dailyDepositUSD.plus(ΔcollateralUSD)
    : marketDailySnapshot.dailyDepositUSD;
  marketDailySnapshot.dailyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? marketDailySnapshot.dailyBorrowUSD.plus(ΔdebtUSD)
    : marketDailySnapshot.dailyBorrowUSD;

  financialsDailySnapshot.dailyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? financialsDailySnapshot.dailyDepositUSD.plus(ΔcollateralUSD)
    : financialsDailySnapshot.dailyDepositUSD;
  financialsDailySnapshot.dailyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? financialsDailySnapshot.dailyBorrowUSD.plus(ΔdebtUSD)
    : financialsDailySnapshot.dailyBorrowUSD;

  protocol.cumulativeDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? protocol.cumulativeDepositUSD.plus(ΔcollateralUSD)
    : protocol.cumulativeDepositUSD;
  protocol.cumulativeBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? protocol.cumulativeBorrowUSD.plus(ΔdebtUSD)
    : protocol.cumulativeBorrowUSD;

  if (dink.gt(BIGINT_ZERO)){ // if change in collateral is > 0
    handleEvent(event, market, "DEPOSIT", dink, ΔcollateralUSD, dart);
  }
  if (dart.gt(BIGINT_ZERO)) { // if change in debt is > 0
    handleEvent(event, market, "BORROW", dink, ΔcollateralUSD, dart);
  }
  if (dink.lt(BIGINT_ZERO)) { // if change in collateral is < 0
    handleEvent(event, market, "WITHDRAW", dink, ΔcollateralUSD, dart);
  }
  if (dart.lt(BIGINT_ZERO)) { // if change in debt is < 0
    handleEvent(event, market, "REPAY", dink, ΔcollateralUSD, dart);
  }

  market.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  financialsDailySnapshot.save();
  protocol.save();

  updateTotalBorrowUSD(); // protocol debt: add dart * rate to protocol debt
  updateMarketMetrics(ilk, event);
  updateFinancialMetrics(event); // updates TVL and financial daily snapshot
}

// Liquidate a Vault
export function handleGrab(event: LogNote): void {
  let ilk = event.params.arg1;
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))); // delta collateral
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196))); // delta debt
  let market = getMarketFromIlk(ilk);
  if (!market) {
    return;
  }
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  if (!marketHourlySnapshot || !marketDailySnapshot) {
    return;
  }
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let collateralToken = getOrCreateToken(Address.fromString(market.inputToken!));
  let collateralTokenUSD = getOrCreateToken(Address.fromString(collateralToken.id)).lastPriceUSD;
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD!);
  let ΔdebtUSD = bigIntToBigDecimal(dart, WAD);
  let totalLiqudationUSD = absValBigDecimal(ΔdebtUSD);
  // liquidation profit = dart * rate * liq penalty
  let liquidationProfit = absValBigDecimal(
    bigIntToBigDecimal(absValBigInt(dart), WAD)
      .times(market.debtMultiplier)
      .times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED)),
  );
  let inputTokenBalance = market.inputTokenBalance.minus(absValBigInt(dink));
  let outputTokenSupply = market.outputTokenSupply.minus(absValBigInt(dart));

  market.inputTokenBalance = inputTokenBalance;
  market.outputTokenSupply = outputTokenSupply;
  market.totalBorrowBalanceUSD = bigIntToBigDecimal(outputTokenSupply, WAD);
  market.totalDepositBalanceUSD = bigIntToBigDecimal(inputTokenBalance, WAD).times(collateralTokenUSD!);
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(totalLiqudationUSD);

  marketHourlySnapshot.hourlyLiquidateUSD = marketHourlySnapshot.hourlyLiquidateUSD.plus(totalLiqudationUSD);
  marketDailySnapshot.dailyLiquidateUSD = marketDailySnapshot.dailyLiquidateUSD.plus(totalLiqudationUSD);

  financialsDailySnapshot.dailyLiquidateUSD = financialsDailySnapshot.dailyLiquidateUSD.plus(totalLiqudationUSD);
  financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    liquidationProfit,
  );
  financialsDailySnapshot.dailyTotalRevenueUSD = financialsDailySnapshot.dailyTotalRevenueUSD.plus(liquidationProfit);

  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(totalLiqudationUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(liquidationProfit);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(liquidationProfit);

  market.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  financialsDailySnapshot.save();
  protocol.save();
  handleEvent(event, market, "LIQUIDATE", dink, ΔcollateralUSD, dart);
  updateMarketMetrics(ilk, event);
  updateUsageMetrics(event, event.transaction.from); // add liquidator
  updateFinancialMetrics(event); // updates TVL and financial daily snapshot
}

// Create/destroy equal quantities of stablecoin and system debt
export function handleHeal(event: LogNote): void {
  updateTotalBorrowUSD(); // subtract debt
  updateFinancialsDailySnapshot(event);
}

export function handleSuck(event: LogNote): void {
  let rad = bigIntToBigDecimal(bytesToUnsignedBigInt(event.params.arg3), RAD);
  log.debug("handleSuck arg1 = {}, arg2 = {}, vow = {}, pot = {} ", [
    "0x" +
      event.params.arg1
        .toHexString()
        .substring(26)
        .toLowerCase(),
    "0x" +
      event.params.arg2
        .toHexString()
        .substring(26)
        .toLowerCase(),
    MCD_VOW_ADDRESS,
    MCD_POT_ADDRESS,
  ]);
  if (
    "0x" +
      event.params.arg1
        .toHexString()
        .substring(26)
        .toLowerCase() ==
      MCD_VOW_ADDRESS &&
    "0x" +
      event.params.arg2
        .toHexString()
        .substring(26)
        .toLowerCase() ==
      MCD_POT_ADDRESS // Dai reallocated from Vow address to Dai stakes in Pot for supply side revenue
  ) {
    let FinancialsDailySnapshot = getOrCreateFinancials(event);
    let protocol = getOrCreateLendingProtocol();
    log.debug("supplySideRevenueUSD = {}", [rad.toString()]);
    FinancialsDailySnapshot.dailySupplySideRevenueUSD = FinancialsDailySnapshot.dailySupplySideRevenueUSD.plus(rad);
    FinancialsDailySnapshot.dailyTotalRevenueUSD = FinancialsDailySnapshot.dailyTotalRevenueUSD.plus(rad);
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(rad);
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(rad);
    FinancialsDailySnapshot.save();
    protocol.save();
  }
  updateTotalBorrowUSD(); // add debt
  updateFinancialsDailySnapshot(event);
}

export function handleFold(event: LogNote): void {
  let ilk = event.params.arg1;
  let dRate = bigIntToBigDecimal(bytesToSignedInt(event.params.arg3), RAY);
  log.debug("dRate = {}", [dRate.toString()]);
  let market = getMarketFromIlk(ilk);
  if (!market) {
    return;
  }
  // stability fee collection, fold is called when someone calls jug.drip which increases debt balance for user
  let feesAccrued = dRate.times(market.totalBorrowBalanceUSD); // change in rate multiplied by total borrowed amt, compounded
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();

  market.debtMultiplier = market.debtMultiplier.plus(dRate);
  financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    feesAccrued,
  );
  financialsDailySnapshot.dailyTotalRevenueUSD = financialsDailySnapshot.dailyTotalRevenueUSD.plus(feesAccrued);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(feesAccrued);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(feesAccrued);

  market.save();
  financialsDailySnapshot.save();
  protocol.save();
  updateTotalBorrowUSD(); // add debt
  updateFinancialsDailySnapshot(event);
}
