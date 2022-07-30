import { ethereum, BigDecimal, BigInt, log, Address } from "@graphprotocol/graph-ts";
import {
  Market,
  Account,
  ActiveAccount,
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
  Token,
} from "../../generated/schema";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  BIGINT_NEG_ONE,
  BIGDECIMAL_NEG_ONE,
  DAI_ADDRESS,
  VAT_ADDRESS,
  WAD,
  RAD,
} from "./constants";
import { createEventID } from "../utils/strings";
import { bigIntToBDUseDecimals } from "../utils/numbers";
import { Vat } from "../../generated/Vat/Vat";
import { DAI } from "../../generated/Vat/DAI";
import { getOrCreateMarket } from "./getters";

export function updateProtocol(
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();

  // update Deposit
  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deltaCollateralUSD);
  }

  // protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(deltaCollateralUSD);
  // instead, iterate over markets to get "mark-to-market" deposit balance
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < protocol.marketIDList.length; i++) {
    let marketID = protocol.marketIDList[i];
    let market = Market.load(marketID);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(market!.totalBorrowBalanceUSD);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(market!.totalDepositBalanceUSD);
  }
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;

  /* alternatively, get total borrow (debt) from vat.debt
  // this would include borrow interest, etc
  // so they two will have some difference
  let vatContract = Vat.bind(Address.fromString(VAT_ADDRESS));
  let debtCall = vatContract.try_debt();
  if (debtCall.reverted) {
    log.warning("[updateProtocal]Failed to call Vat.debt; not updating protocol.totalBorrowBalanceUSD", []);
  } else {
    protocol.totalBorrowBalanceUSD = bigIntToBDUseDecimals(debtCall.value, RAD+);
  }
  */

  // update Borrow
  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
      protocol.cumulativeSupplySideRevenueUSD,
    );
  }

  // update mintedTokenSupplies
  let daiContract = DAI.bind(Address.fromString(DAI_ADDRESS));
  protocol.mintedTokens = [DAI_ADDRESS];
  protocol.mintedTokenSupplies = [daiContract.totalSupply()];

  protocol.save();
}

export function updateMarket(
  marketID: string,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let market = getOrCreateMarket(marketID);

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // ignore as we don't care about cumulativeWithdraw in a market
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // again ignore repay
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeProtocolSideRevenueUSD = market.cumulativeTotalRevenueUSD.minus(
      market.cumulativeSupplySideRevenueUSD,
    );
  }
  market.save();
}

export function updateMarketSnapshot(
  market: Market,
  event: ethereum.Event,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let marketID = market.id;
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, marketID);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, marketID);
  if (marketHourlySnapshot == null || marketDailySnapshot == null) {
    log.error("[updateMarketSnapshot]Failed to get marketsnapshot for {}", [marketID]);
    return;
  }

  marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketHourlySnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketHourlySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketHourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketHourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  //marketHourlySnapshot.outputTokenSupply = market.outputTokenSupply;
  //marketHourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;

  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketDailySnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketDailySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketDailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketDailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  //marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  //marketDailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyDepositUSD = marketHourlySnapshot.hourlyDepositUSD.plus(deltaCollateralUSD);
    marketDailySnapshot.dailyDepositUSD = marketDailySnapshot.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyWithdrawUSD = marketHourlySnapshot.hourlyWithdrawUSD.minus(deltaCollateralUSD);
    marketDailySnapshot.dailyWithdrawUSD = marketDailySnapshot.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyBorrowUSD = marketHourlySnapshot.hourlyBorrowUSD.plus(deltaDebtUSD);
    marketDailySnapshot.dailyBorrowUSD = marketDailySnapshot.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyRepayUSD = marketHourlySnapshot.hourlyRepayUSD.minus(deltaDebtUSD);
    marketDailySnapshot.dailyRepayUSD = marketDailySnapshot.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyLiquidateUSD = marketHourlySnapshot.hourlyLiquidateUSD.plus(liquidateUSD);
    marketDailySnapshot.dailyLiquidateUSD = marketDailySnapshot.dailyLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
    marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlySupplySideRevenueUSD = marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD,
    );
    marketDailySnapshot.dailySupplySideRevenueUSD = marketDailySnapshot.dailySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD,
    );
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.minus(
      marketHourlySnapshot.hourlySupplySideRevenueUSD,
    );
    marketDailySnapshot.dailyProtocolSideRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.minus(
      marketDailySnapshot.dailySupplySideRevenueUSD,
    );
  }
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
}

export function updateFinancialsSnapshot(
  event: ethereum.Event,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let financials = getOrCreateFinancials(event);

  financials.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financials.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financials.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financials.mintedTokenSupplies = protocol.mintedTokenSupplies;

  financials.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financials.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financials.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financials.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financials.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financials.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyDepositUSD = financials.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyWithdrawUSD = financials.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyBorrowUSD = financials.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyRepayUSD = financials.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyLiquidateUSD = financials.dailyLiquidateUSD.plus(liquidateUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyTotalRevenueUSD = financials.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailySupplySideRevenueUSD = financials.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  financials.dailyProtocolSideRevenueUSD = financials.dailyTotalRevenueUSD.minus(financials.dailySupplySideRevenueUSD);

  financials.blockNumber = event.block.number;
  financials.timestamp = event.block.timestamp;
  financials.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  users: string[] = [], //user u, v, w
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  // userU, userV, userW may be the same, they may not
  for (let i: i32 = 0; i < users.length; i++) {
    let accountID = users[i];
    let account = Account.load(accountID);
    if (account == null) {
      account = new Account(accountID);
      account.save();

      protocol.cumulativeUniqueUsers += 1;
      usageHourlySnapshot.cumulativeUniqueUsers += 1;
      usageDailySnapshot.cumulativeUniqueUsers += 1;
    }

    let hours: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
    let hourlyActiveAcctountID = "hourly-"
      .concat(accountID)
      .concat("-")
      .concat(hours.toString());
    let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAcctountID);
    if (hourlyActiveAccount == null) {
      hourlyActiveAccount = new ActiveAccount(hourlyActiveAcctountID);
      hourlyActiveAccount.save();

      usageHourlySnapshot.hourlyActiveUsers += 1;
    }

    let days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    let dailyActiveAcctountID = "daily-"
      .concat(accountID)
      .concat("-")
      .concat(days.toString());
    let dailyActiveAccount = ActiveAccount.load(dailyActiveAcctountID);
    if (dailyActiveAccount == null) {
      dailyActiveAccount = new ActiveAccount(dailyActiveAcctountID);
      dailyActiveAccount.save();

      usageDailySnapshot.dailyActiveUsers += 1;
    }
  }

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyDepositCount += 1;
    usageDailySnapshot.dailyDepositCount += 1;
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyWithdrawCount += 1;
    usageDailySnapshot.dailyWithdrawCount += 1;
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyBorrowCount += 1;
    usageDailySnapshot.dailyBorrowCount += 1;
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyRepayCount += 1;
    usageDailySnapshot.dailyRepayCount += 1;
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyLiquidateCount += 1;
    usageDailySnapshot.dailyLiquidateCount += 1;
  }

  usageHourlySnapshot.hourlyTransactionCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.timestamp = event.block.timestamp;

  protocol.save();
  usageHourlySnapshot.save();
  usageDailySnapshot.save();
}

export function handleTransactions(
  event: ethereum.Event,
  marketID: string,
  userU: string,
  userV: string,
  userW: string,
  tokenID: string,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateAmt: BigInt = BIGINT_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(marketID);
  let transactionID = createEventID(event);

  if (deltaCollateral.gt(BIGINT_ZERO)) {
    // deposit
    let deposit = new Deposit("DEPOSIT-" + transactionID);
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = protocol.id;
    deposit.to = marketID;
    deposit.from = userV;
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.market = marketID;
    deposit.asset = tokenID;
    deposit.amount = deltaCollateral;
    deposit.amountUSD = deltaCollateralUSD;
    deposit.save();
  } else if (deltaCollateral.lt(BIGINT_ZERO)) {
    //withdraw
    let withdraw = new Withdraw("WITHDRAW-" + transactionID);
    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.protocol = protocol.id;
    withdraw.to = userV;
    withdraw.from = marketID;
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.market = marketID;
    withdraw.asset = tokenID;
    withdraw.amount = deltaCollateral.times(BIGINT_NEG_ONE);
    withdraw.amountUSD = deltaCollateralUSD.times(BIGDECIMAL_NEG_ONE);
    withdraw.save();
  }

  if (deltaDebt.gt(BIGINT_ZERO)) {
    // borrow
    let borrow = new Borrow("BORROW-" + transactionID);
    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.protocol = protocol.id;
    borrow.to = userW;
    borrow.from = marketID;
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;
    borrow.market = marketID;
    borrow.asset = tokenID;
    borrow.amount = deltaDebt;
    borrow.amountUSD = deltaDebtUSD;
    borrow.save();
  } else if (deltaDebt.lt(BIGINT_ZERO)) {
    // repay
    let repay = new Repay("REPAY-" + transactionID);
    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.protocol = protocol.id;
    repay.to = marketID;
    repay.from = userW;
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;
    repay.market = marketID;
    repay.asset = tokenID;
    repay.amount = deltaDebt.times(BIGINT_NEG_ONE);
    repay.amountUSD = deltaDebtUSD.times(BIGDECIMAL_NEG_ONE);
    repay.save();
  }

  // liquidate is handled by getOrCreateLiquidate() in getters
}

export function updatePriceForMarket(marketID: string, event: ethereum.Event): void {
  // Price is updated for market marketID
  let market = getOrCreateMarket(marketID);
  let token = Token.load(market.inputToken);
  market.totalDepositBalanceUSD = bigIntToBDUseDecimals(market.inputTokenBalance, token!.decimals).times(
    market.inputTokenPriceUSD,
  );
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  // iterate to update protocol level totalDepositBalanceUSD
  let protocol = getOrCreateLendingProtocol();
  let marketIDList = protocol.marketIDList;
  let protocolTotalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    let marketAddress = marketIDList[i];
    let market = getOrCreateMarket(marketAddress);
    if (market == null) {
      log.warning("[updatePriceForMarket]market {} doesn't exist", [marketAddress]);
      continue;
    }
    protocolTotalDepositBalanceUSD = protocolTotalDepositBalanceUSD.plus(market.totalDepositBalanceUSD);
  }

  protocol.totalDepositBalanceUSD = protocolTotalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  updateFinancialsSnapshot(event);
}

export function updateRevenue(
  event: ethereum.Event,
  marketID: string,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let market = getOrCreateMarket(marketID);
  if (market) {
    market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
    market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
    market.cumulativeProtocolSideRevenueUSD = market.cumulativeTotalRevenueUSD.minus(
      market.cumulativeSupplySideRevenueUSD,
    );
    market.save();

    updateMarket(
      market.id,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      newTotalRevenueUSD,
      newSupplySideRevenueUSD,
    );
    updateMarketSnapshot(
      market,
      event,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      newTotalRevenueUSD,
      newSupplySideRevenueUSD,
    );
  }
  // or call updateProtocol
  let protocol = getOrCreateLendingProtocol();
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
    protocol.cumulativeSupplySideRevenueUSD,
  );
  protocol.save();

  updateFinancialsSnapshot(
    event,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
  );
}
