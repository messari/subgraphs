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
import { updateTVL, updateMarketMetrics, updateUsageMetrics, updateTotalBorrowUSD } from "./common/metrics";
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
  let protocol = getOrCreateLendingProtocol();
  let usageMetricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  let usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  if (eventType == "DEPOSIT") {
    let depositEvent = new Deposit("deposit-" + createEntityID(event));
    let borrowEvent = new Borrow("borrow-" + createEntityID(event));
    depositEvent.hash = event.transaction.hash.toHexString();
    depositEvent.logIndex = event.logIndex.toI32();
    depositEvent.protocol = protocol.id;
    depositEvent.to = market.id;
    depositEvent.from = event.transaction.from.toHexString();
    depositEvent.blockNumber = event.block.number;
    depositEvent.timestamp = event.block.timestamp;
    depositEvent.market = market.id;
    depositEvent.asset = getOrCreateToken(Address.fromString(market.inputToken)).id;
    depositEvent.amount = absValBigInt(amountCollateral);
    depositEvent.amountUSD = absValBigDecimal(amountCollateralUSD);
    usageMetricsHourlySnapshot.hourlyDepositCount += 1;
    usageMetricsDailySnapshot.dailyDepositCount += 1;

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

    depositEvent.save();
    borrowEvent.save();
    usageMetricsHourlySnapshot.save();
    usageMetricsDailySnapshot.save();
  } else if (eventType == "WITHDRAW") {
    let withdrawEvent = new Withdraw("withdraw-" + createEntityID(event));
    let repayEvent = new Repay("repay-" + createEntityID(event));
    withdrawEvent.hash = event.transaction.hash.toHexString();
    withdrawEvent.logIndex = event.logIndex.toI32();
    withdrawEvent.protocol = protocol.id;
    withdrawEvent.to = market.id;
    withdrawEvent.from = event.transaction.from.toHexString();
    withdrawEvent.blockNumber = event.block.number;
    withdrawEvent.timestamp = event.block.timestamp;
    withdrawEvent.market = market.id;
    withdrawEvent.asset = getOrCreateToken(Address.fromString(market.inputToken)).id;
    withdrawEvent.amount = absValBigInt(amountCollateral);
    withdrawEvent.amountUSD = absValBigDecimal(amountCollateralUSD);
    usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;
    usageMetricsDailySnapshot.dailyWithdrawCount += 1;

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

    withdrawEvent.save();
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
    liquidateEvent.asset = getOrCreateToken(Address.fromString(market.inputToken)).id;
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
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let inputTokenBalance = market.inputTokenBalance.plus(dink);
  let collateralToken = getOrCreateToken(Address.fromString(market.inputToken));
  let collateralTokenUSD = getOrCreateToken(Address.fromString(collateralToken.id)).lastPriceUSD;
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD);
  let ΔdebtUSD = bigIntToBigDecimal(dart, WAD);
  let cumulativeDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? protocol.cumulativeDepositUSD.plus(ΔcollateralUSD)
    : protocol.cumulativeDepositUSD;
  let cumulativeBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? protocol.cumulativeBorrowUSD.plus(ΔdebtUSD)
    : protocol.cumulativeBorrowUSD;

  market.inputTokenBalance = inputTokenBalance;
  market.inputTokenPriceUSD = collateralTokenUSD;
  market.outputTokenSupply = market.outputTokenSupply.plus(dart);
  market.totalBorrowBalanceUSD = bigIntToBigDecimal(market.outputTokenSupply, WAD);
  market.totalDepositBalanceUSD = bigIntToBigDecimal(inputTokenBalance, WAD).times(collateralTokenUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  marketHourlySnapshot.hourlyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? marketHourlySnapshot.hourlyDepositUSD.plus(ΔcollateralUSD)
    : marketHourlySnapshot.hourlyDepositUSD;
  marketHourlySnapshot.hourlyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? marketHourlySnapshot.hourlyBorrowUSD.plus(ΔdebtUSD)
    : marketHourlySnapshot.hourlyBorrowUSD;
  marketHourlySnapshot.cumulativeDepositUSD = cumulativeDepositUSD;
  marketHourlySnapshot.cumulativeBorrowUSD = cumulativeBorrowUSD;

  marketDailySnapshot.dailyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? marketDailySnapshot.dailyDepositUSD.plus(ΔcollateralUSD)
    : marketDailySnapshot.dailyDepositUSD;
  marketDailySnapshot.dailyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? marketDailySnapshot.dailyBorrowUSD.plus(ΔdebtUSD)
    : marketDailySnapshot.dailyBorrowUSD;
  marketDailySnapshot.cumulativeDepositUSD = cumulativeDepositUSD;
  marketDailySnapshot.cumulativeBorrowUSD = cumulativeBorrowUSD;

  financialsDailySnapshot.dailyDepositUSD = ΔcollateralUSD.gt(BIGDECIMAL_ZERO)
    ? financialsDailySnapshot.dailyDepositUSD.plus(ΔcollateralUSD)
    : financialsDailySnapshot.dailyDepositUSD;
  financialsDailySnapshot.dailyBorrowUSD = ΔdebtUSD.gt(BIGDECIMAL_ZERO)
    ? financialsDailySnapshot.dailyBorrowUSD.plus(ΔdebtUSD)
    : financialsDailySnapshot.dailyBorrowUSD;
  financialsDailySnapshot.cumulativeDepositUSD = cumulativeDepositUSD;
  financialsDailySnapshot.cumulativeBorrowUSD = cumulativeBorrowUSD;

  protocol.cumulativeDepositUSD = cumulativeDepositUSD;
  protocol.cumulativeBorrowUSD = cumulativeBorrowUSD;

  if (dart.gt(BIGINT_ZERO)) {
    handleEvent(event, market, "DEPOSIT", dink, ΔcollateralUSD, dart);
  } else if (dart.lt(BIGINT_ZERO)) {
    handleEvent(event, market, "WITHDRAW", dink, ΔcollateralUSD, dart);
  }
  market.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  financialsDailySnapshot.save();
  protocol.save();
  updateTotalBorrowUSD(event); // protocol debt: add dart * rate to protocol debt
  updateMarketMetrics(ilk, event);
  updateTVL(event);
}

// Liquidate a Vault
export function handleGrab(event: LogNote): void {
  let ilk = event.params.arg1;
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))); // delta collateral
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196))); // delta debt
  let market = getMarketFromIlk(ilk);
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let collateralToken = getOrCreateToken(Address.fromString(market.inputToken));
  let collateralTokenUSD = getOrCreateToken(Address.fromString(collateralToken.id)).lastPriceUSD;
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD);
  let ΔdebtUSD = bigIntToBigDecimal(dart, WAD);
  let totalLiqudationUSD = absValBigDecimal(ΔdebtUSD);
  // liquidation profit = dart * rate * liq penalty
  let liquidationProfit = absValBigDecimal(
    bigIntToBigDecimal(absValBigInt(dart), WAD)
      .times(market.debtMultiplier)
      .times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED)),
  );
  let cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(totalLiqudationUSD);
  let inputTokenBalance = market.inputTokenBalance.minus(absValBigInt(dink));
  let outputTokenSupply = market.outputTokenSupply.minus(absValBigInt(dart));

  let protocolCumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(totalLiqudationUSD);
  market.inputTokenBalance = inputTokenBalance;
  market.totalDepositBalanceUSD = bigIntToBigDecimal(inputTokenBalance, WAD).times(collateralTokenUSD);
  market.outputTokenSupply = outputTokenSupply;
  market.totalBorrowBalanceUSD = bigIntToBigDecimal(outputTokenSupply, WAD);
  market.cumulativeLiquidateUSD = cumulativeLiquidateUSD;

  marketHourlySnapshot.hourlyLiquidateUSD = marketHourlySnapshot.hourlyLiquidateUSD.plus(totalLiqudationUSD);
  marketHourlySnapshot.cumulativeLiquidateUSD = cumulativeLiquidateUSD;

  marketDailySnapshot.dailyLiquidateUSD = marketDailySnapshot.dailyLiquidateUSD.plus(totalLiqudationUSD);
  marketDailySnapshot.cumulativeLiquidateUSD = cumulativeLiquidateUSD;

  financialsDailySnapshot.dailyLiquidateUSD = financialsDailySnapshot.dailyLiquidateUSD.plus(totalLiqudationUSD);
  financialsDailySnapshot.cumulativeLiquidateUSD = protocolCumulativeLiquidateUSD;
  financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    liquidationProfit,
  );
  financialsDailySnapshot.dailyTotalRevenueUSD = financialsDailySnapshot.dailyTotalRevenueUSD.plus(liquidationProfit);

  protocol.cumulativeLiquidateUSD = cumulativeLiquidateUSD;
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(liquidationProfit);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(liquidationProfit);

  market.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  financialsDailySnapshot.save();
  protocol.save();
  handleEvent(event, market, "LIQUIDATE", dink, ΔcollateralUSD, dart);
  updateMarketMetrics(ilk, event);
  updateTVL(event);
  updateUsageMetrics(event, event.transaction.from); // add liquidator
}

// Create/destroy equal quantities of stablecoin and system debt
export function handleHeal(event: LogNote): void {
  updateTotalBorrowUSD(event); // subtract debt
}

export function handleSuck(event: LogNote): void {
  let rad = bigIntToBigDecimal(bytesToUnsignedBigInt(event.params.arg3), RAD);
  updateTotalBorrowUSD(event); // add debt
  if (
    event.params.arg1
      .toHexString()
      .substring(26)
      .toLowerCase() == MCD_VOW_ADDRESS &&
    event.params.arg2
      .toHexString()
      .substring(26)
      .toLowerCase() == MCD_POT_ADDRESS // Dai reallocated from Vow address to Dai stakes in Pot for supply side revenue
  ) {
    let FinancialsDailySnapshot = getOrCreateFinancials(event);
    let protocol = getOrCreateLendingProtocol();
    log.debug("supplySideRevenueUSD = {}", [rad.toString()]);
    let cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(rad);
    FinancialsDailySnapshot.dailySupplySideRevenueUSD = FinancialsDailySnapshot.dailySupplySideRevenueUSD.plus(rad);
    FinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD = cumulativeSupplySideRevenueUSD;
    FinancialsDailySnapshot.dailyTotalRevenueUSD = FinancialsDailySnapshot.dailyTotalRevenueUSD.plus(rad);
    protocol.cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD;
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(rad);
    FinancialsDailySnapshot.save();
    protocol.save();
  }
}

export function handleFold(event: LogNote): void {
  let ilk = event.params.arg1;
  let dRate = bigIntToBigDecimal(bytesToSignedInt(event.params.arg3), RAY);
  log.debug("dRate = {}", [dRate.toString()]);
  let market = getMarketFromIlk(ilk);
  // stability fee collection, fold is called when someone calls jug.drip which increases debt balance for user
  let feesAccrued = dRate.times(market.totalBorrowBalanceUSD); // change in rate multiplied by total borrowed amt, compounded
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(feesAccrued);
  let cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(feesAccrued);

  market.debtMultiplier = market.debtMultiplier.plus(dRate);
  financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    feesAccrued,
  );
  financialsDailySnapshot.dailyTotalRevenueUSD = financialsDailySnapshot.dailyTotalRevenueUSD.plus(feesAccrued);
  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshot.cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  protocol.cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD;

  market.save();
  financialsDailySnapshot.save();
  protocol.save();
  updateTotalBorrowUSD(event); // add debt
}
