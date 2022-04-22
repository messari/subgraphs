import { BigInt, Address, Bytes, log, BigDecimal } from "@graphprotocol/graph-ts";
import { Vat, LogNote } from "../generated/Vat/Vat";
import { Borrow, Deposit, Liquidate, Market, Repay, Withdraw, _Ilk } from "../generated/schema";
import {
  RAY,
  DAI,
  BIGINT_ZERO,
  RAD,
  BIGDECIMAL_ONE_HUNDRED,
  WAD,
  VOW_ADDRESS_TOPIC,
  POT_ADDRESS_TOPIC,
} from "./common/constants";
import { getMarket, getMarketFromIlk, getOrCreateLendingProtocol, getOrCreateToken } from "./common/getters";
import { createMarket } from "./common/setters";
import { bigIntToBigDecimal, bytesToSignedInt, absValBigInt, absValBigDecimal } from "./common/utils/numbers";
import { getOrCreateTokenPriceEntity } from "./common/prices/prices";
import { getOrCreateFinancials } from "./common/getters";
import { updateTVL, updateMarketMetrics, updateUsageMetrics } from "./common/metrics";
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
  event: LogNote,
  market: Market,
  eventType: string,
  amountCollateral: BigInt,
  amountCollateralUSD: BigDecimal,
  amountDAI: BigInt,
): void {
  let protocol = getOrCreateLendingProtocol();
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
    depositEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id;
    depositEvent.amount = absValBigInt(amountCollateral);
    depositEvent.amountUSD = absValBigDecimal(amountCollateralUSD);

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

    depositEvent.save();
    borrowEvent.save();
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
    withdrawEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id;
    withdrawEvent.amount = absValBigInt(amountCollateral);
    withdrawEvent.amountUSD = absValBigDecimal(amountCollateralUSD);

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

    withdrawEvent.save();
    repayEvent.save();
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
    liquidateEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id;
    liquidateEvent.amount = absValBigInt(amountCollateral);
    liquidateEvent.amountUSD = absValBigDecimal(amountCollateralUSD);
    liquidateEvent.profitUSD = bigIntToBigDecimal(absValBigInt(amountDAI), WAD)
      .times(market.debtMultiplier)
      .times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED));
    liquidateEvent.save();
  }
}

// Create or modify a Vault
export function handleFrob(event: LogNote): void {
  let ilk = event.params.arg1;
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))); // change in collateral
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196))); // change in debt
  let market = getMarketFromIlk(ilk);
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let collateralToken = getOrCreateToken(Address.fromString(market.inputTokens[0]));
  let collateralTokenUSD = getOrCreateTokenPriceEntity(collateralToken.id).priceUSD;
  let inputTokenBalances = market.inputTokenBalances;
  let inputTokenBalance = inputTokenBalances[0];
  let inputTokenBalancePost = inputTokenBalance.plus(dink);
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD);
  let totalBorrowUSD = protocol.totalBorrowUSD.plus(bigIntToBigDecimal(dart, WAD).times(market.debtMultiplier)); // protocol debt: add dart * rate to protocol debt
  market.inputTokenBalances = [inputTokenBalancePost];
  market.outputTokenSupply = market.outputTokenSupply.plus(dart);
  market.totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply, WAD);
  market.totalDepositUSD = bigIntToBigDecimal(inputTokenBalancePost, WAD).times(collateralTokenUSD);
  market.totalValueLockedUSD = market.totalDepositUSD;
  financialsDailySnapshot.totalBorrowUSD = totalBorrowUSD;
  protocol.totalBorrowUSD = totalBorrowUSD;
  if (dart.gt(BIGINT_ZERO)) {
    log.debug("dart", [dart.toString()]);
    handleEvent(event, market, "DEPOSIT", dink, ΔcollateralUSD, dart);
  } else if (dart.lt(BIGINT_ZERO)) {
    log.debug("dart", [dart.toString()]);
    handleEvent(event, market, "WITHDRAW", dink, ΔcollateralUSD, dart);
  }
  market.save();
  financialsDailySnapshot.save();
  protocol.save();
  updateMarketMetrics(ilk, event);
  updateTVL(event);
}

// Liquidate a Vault
export function handleGrab(event: LogNote): void {
  let ilk = event.params.arg1;
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164)));
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196)));
  let market = getMarketFromIlk(ilk);
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let collateralToken = getOrCreateToken(Address.fromString(market.inputTokens[0]));
  let collateralTokenUSD = getOrCreateTokenPriceEntity(collateralToken.id).priceUSD;
  let inputTokenBalances = market.inputTokenBalances;
  let inputTokenBalance = inputTokenBalances[0];
  let inputTokenBalancePost = inputTokenBalance.plus(dink);
  let ΔcollateralUSD = bigIntToBigDecimal(dink, WAD).times(collateralTokenUSD);
  // liquidation profit = dart * rate * liq penalty
  let liquidationProfit = bigIntToBigDecimal(absValBigInt(dart), WAD)
    .times(market.debtMultiplier)
    .times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED));
  market.inputTokenBalances = [inputTokenBalancePost];
  market.outputTokenSupply = market.outputTokenSupply.plus(dart);
  market.totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply, WAD).times(market.debtMultiplier);
  market.totalDepositUSD = bigIntToBigDecimal(inputTokenBalancePost, WAD).times(collateralTokenUSD);
  market.totalValueLockedUSD = market.totalDepositUSD;
  financialsDailySnapshot.protocolSideRevenueUSD =
    financialsDailySnapshot.protocolSideRevenueUSD.plus(liquidationProfit);
  financialsDailySnapshot.totalRevenueUSD = financialsDailySnapshot.totalRevenueUSD.plus(liquidationProfit);
  market.save();
  financialsDailySnapshot.save();
  handleEvent(event, market, "LIQUIDATE", dink, ΔcollateralUSD, dart);
  updateMarketMetrics(ilk, event);
  updateTVL(event);
  updateUsageMetrics(event, event.transaction.from); // add liquidator
}

// Create/destroy equal quantities of stablecoin and system debt
export function handleHeal(event: LogNote): void {
  let rad = bigIntToBigDecimal(bytesToSignedInt(event.params.arg1), RAY);
  let FinancialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let totalBorrowUSD = protocol.totalBorrowUSD.minus(rad);
  FinancialsDailySnapshot.totalBorrowUSD = totalBorrowUSD;
  protocol.totalBorrowUSD = totalBorrowUSD;
  FinancialsDailySnapshot.save();
  protocol.save();
}

export function handleSuck(event: LogNote): void {
  if (
    event.params.arg1.toHexString().toLowerCase() == VOW_ADDRESS_TOPIC &&
    event.params.arg2.toHexString().toLowerCase() == POT_ADDRESS_TOPIC
  ) {
    let FinancialsDailySnapshot = getOrCreateFinancials(event);
    let protocol = getOrCreateLendingProtocol();
    let accumSavings = bigIntToBigDecimal(bytesToUnsignedBigInt(event.params.arg3), RAD);
    let totalBorrowUSD = protocol.totalBorrowUSD.plus(accumSavings);
    log.debug("supplySideRevenueUSD = {}", [accumSavings.toString()]);
    FinancialsDailySnapshot.supplySideRevenueUSD = FinancialsDailySnapshot.supplySideRevenueUSD.plus(accumSavings);
    FinancialsDailySnapshot.totalBorrowUSD = totalBorrowUSD;
    protocol.totalBorrowUSD = totalBorrowUSD;
    FinancialsDailySnapshot.save();
    protocol.save();
  }
}

export function handleFold(event: LogNote): void {
  let ilk = event.params.arg1;
  let dRate = bigIntToBigDecimal(bytesToSignedInt(event.params.arg3), RAY);
  log.debug("dRate = {}", [dRate.toString()]);
  let market = getMarketFromIlk(ilk);
  let rad = bigIntToBigDecimal(market.outputTokenSupply, WAD).times(dRate);
  // stability fee collection, fold is called when someone calls jug.drip which increases debt balance for user
  let feesAccrued = dRate.times(market.totalBorrowUSD); // change in rate multiplied by total borrowed amt, compounded
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let totalBorrowUSD = protocol.totalBorrowUSD.plus(rad);
  financialsDailySnapshot.protocolSideRevenueUSD = financialsDailySnapshot.protocolSideRevenueUSD.plus(feesAccrued);
  financialsDailySnapshot.totalRevenueUSD = financialsDailySnapshot.totalRevenueUSD.plus(feesAccrued);
  financialsDailySnapshot.totalBorrowUSD = totalBorrowUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  market.debtMultiplier = market.debtMultiplier.plus(dRate);
  protocol.totalBorrowUSD = totalBorrowUSD;
  financialsDailySnapshot.save();
  market.save();
}
