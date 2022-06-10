import {
  INT_ZERO,
  INT_ONE,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_HUNDRED,
  FACTORY_ADDRESS,
  XINV_ADDRESS,
  DOLA_ADDRESS,
  MANTISSA_DECIMALS,
  InterestRateSide,
  InterestRateType,
  SECONDS_PER_DAY,
  BLOCKS_PER_YEAR,
  EMISSION_START_BLOCK,
  BLOCKS_PER_DAY,
  BIGINT_ONE,
} from "./constants";
import { CErc20, Mint, Redeem, Borrow, RepayBorrow, LiquidateBorrow } from "../../generated/templates/CToken/CErc20";
import { JumpRateModelV2 } from "../../generated/templates/CToken/JumpRateModelV2";
import {
  Account,
  ActiveAccount,
  Market,
  Deposit,
  Withdraw,
  Borrow as BorrowSC,
  Repay,
  Liquidate,
  _HelperStore,
} from "../../generated/schema";
import { Factory } from "../../generated/Factory/Factory";
import { log, ethereum, BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import {
  getUnderlyingTokenPricePerAmount,
  getOrCreateInterestRate,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateProtocol,
  getOrCreateUnderlyingToken,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateMarket,
  getUnderlyingTokenPrice,
  getOrCreateToken,
} from "./getters";
import { decimalsToBigDecimal, BigDecimalTruncateToBigInt } from "./utils";

// Create Account entity for participating account
// return 1 if account is new, 0 if account already exists
export function createAndIncrementAccount(accountId: string): i32 {
  // id: string = address.toHexString()
  let account = Account.load(accountId);
  if (account == null) {
    account = new Account(accountId);
    account.save();
    return INT_ONE;
  }
  return INT_ZERO;
}

// Create ActiveAccount entity for participating account
// return 1 if account is new on the day, 0 if account already exists
export function createAndIncrementActiveAccount(activeAccountId: string): i32 {
  // id: string = `{Number of days since Unix epoch}-{address}`
  let account = ActiveAccount.load(activeAccountId);
  if (account == null) {
    account = new ActiveAccount(activeAccountId);
    account.save();
    return INT_ONE;
  }

  return INT_ZERO;
}

// populate deposit entity;
// update
//    - market.cumulativeDepositUSD
//    - protocol.cumulativeDepositUSD
export function updateDeposit(event: Mint): void {
  let depositId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let deposit = Deposit.load(depositId);
  let pricePerUnderlyingToken = getUnderlyingTokenPricePerAmount(event.address);
  let depositAmount = event.params.mintAmount;
  let depositAmountUSD = depositAmount.toBigDecimal().times(pricePerUnderlyingToken);

  if (deposit == null) {
    deposit = new Deposit(depositId);

    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.transactionLogIndex.toI32();
    deposit.protocol = FACTORY_ADDRESS;
    deposit.to = event.address.toHexString(); //dataSource.address().toHexString()
    deposit.from = event.params.minter.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.market = event.address.toHexString();
    deposit.asset = getOrCreateUnderlyingToken(event.address).id;
    deposit.amount = depositAmount;
    deposit.amountUSD = depositAmountUSD;
    deposit.save();
  } else {
    log.warning("Deposit {} already exists", [depositId]);
  }

  // update Market.cumulativeDepositUSD
  let marketId = event.address.toHexString();
  let market = getOrCreateMarket(marketId, event);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(depositAmountUSD);
  market.save();

  // update protocol.cumulativeDepositUSD
  let protocol = getOrCreateProtocol();
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(depositAmountUSD);
  protocol.save();

  // update MarketDailySnapshot
  //      - dailyDepositUSD
  //      - cumulativeDepositUSD
  let marketDaily = getOrCreateMarketDailySnapshot(event);
  marketDaily.dailyDepositUSD = marketDaily.dailyDepositUSD.plus(depositAmountUSD);
  marketDaily.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDaily.blockNumber = event.block.number;
  marketDaily.timestamp = event.block.timestamp;
  marketDaily.save();

  // update MarketHourlySnapshot
  //      - hourlyDepositUSD
  //      - cumulativeDepositUSD
  let marketHourly = getOrCreateMarketHourlySnapshot(event);
  marketHourly.hourlyDepositUSD = marketDaily.dailyDepositUSD.plus(depositAmountUSD);
  marketHourly.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourly.blockNumber = event.block.number;
  marketHourly.timestamp = event.block.timestamp;
  marketHourly.save();

  // update FinancialsDailySnapshot
  //      - dailyDepositUSD
  //      - cumulativeDepositUSD
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyDepositUSD = financialMetrics.dailyDepositUSD.plus(depositAmountUSD);
  financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialMetrics.save();

  // update usage metric
  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyDepositCount += 1;
  usageDailyMetrics.dailyTransactionCount += 1;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyDepositCount += 1;
  usageHourlyMetrics.hourlyTransactionCount += 1;
  usageHourlyMetrics.save();
}

export function updateWithdraw(event: Redeem): void {
  let withdrawId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let withdraw = Withdraw.load(withdrawId);

  if (withdraw == null) {
    let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);

    withdraw = new Withdraw(withdrawId);

    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.transactionLogIndex.toI32();
    withdraw.protocol = FACTORY_ADDRESS;
    withdraw.to = event.params.redeemer.toHexString();
    withdraw.from = event.address.toHexString(); //dataSource.address().toHexString()
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.market = event.address.toHexString();
    withdraw.asset = getOrCreateUnderlyingToken(event.address).id;
    withdraw.amount = event.params.redeemAmount;
    withdraw.amountUSD = withdraw.amount.toBigDecimal().times(pricePerToken);
    withdraw.save();
  } else {
    log.warning("Withdraw {} already exists", [withdrawId]);
  }

  // update usage metric
  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyWithdrawCount += 1;
  usageDailyMetrics.dailyTransactionCount += 1;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyWithdrawCount += 1;
  usageHourlyMetrics.hourlyTransactionCount += 1;
  usageHourlyMetrics.save();
}

export function updateBorrow(event: Borrow): void {
  let borrowId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let borrow = BorrowSC.load(borrowId);
  let pricePerUnderlyingToken = getUnderlyingTokenPricePerAmount(event.address);
  let borrowAmount = event.params.borrowAmount;
  let borrowAmountUSD = borrowAmount.toBigDecimal().times(pricePerUnderlyingToken);

  if (borrow == null) {
    borrow = new BorrowSC(borrowId);

    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.transactionLogIndex.toI32();
    borrow.protocol = FACTORY_ADDRESS;
    borrow.to = event.params.borrower.toHexString();
    borrow.from = event.address.toHexString(); //dataSource.address().toHexString()
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;
    borrow.market = event.address.toHexString();
    borrow.asset = getOrCreateUnderlyingToken(event.address).id;
    borrow.amount = borrowAmount;
    borrow.amountUSD = borrowAmountUSD;

    borrow.save();
  } else {
    log.warning("Borrow {} already exists", [borrowId]);
  }

  // update Market.cumulativeBorrowUSD
  let marketId = event.address.toHexString();
  let market = getOrCreateMarket(marketId, event);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrowAmountUSD);
  market.save();

  // update protocol.cumulativeBorrowUSD
  let protocol = getOrCreateProtocol();
  // protocol.totalBorrowBalanceUSD updated in aggregateAllMarkets()
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrowAmountUSD);
  protocol.save();

  // update MarketDailySnapshot
  //      - dailyBorrowUSD
  //      - cumulativeBorrowUSD
  let marketDaily = getOrCreateMarketDailySnapshot(event);
  marketDaily.dailyBorrowUSD = marketDaily.dailyBorrowUSD.plus(borrowAmountUSD);
  marketDaily.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDaily.blockNumber = event.block.number;
  marketDaily.timestamp = event.block.timestamp;
  marketDaily.save();

  // update MarketHourlySnapshot
  //      - hourlyBorrowUSD
  //      - cumulativeBorrowUSD
  let marketHourly = getOrCreateMarketHourlySnapshot(event);
  marketHourly.hourlyBorrowUSD = marketDaily.dailyBorrowUSD.plus(borrowAmountUSD);
  marketHourly.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourly.blockNumber = event.block.number;
  marketHourly.timestamp = event.block.timestamp;
  marketHourly.save();

  // update FinancialsDailySnapshot
  //      - dailyBorrowUSD
  //      - cumulativeBorrowUSD
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyBorrowUSD = financialMetrics.dailyBorrowUSD.plus(borrowAmountUSD);
  financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialMetrics.save();

  // update usage metric
  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyBorrowCount += 1;
  usageDailyMetrics.dailyTransactionCount += 1;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyBorrowCount += 1;
  usageHourlyMetrics.hourlyTransactionCount += 1;
  usageHourlyMetrics.save();
}

export function updateRepay(event: RepayBorrow): void {
  let repayId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let repay = Repay.load(repayId);

  if (repay == null) {
    let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
    repay = new Repay(repayId);

    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.transactionLogIndex.toI32();
    repay.protocol = FACTORY_ADDRESS;
    repay.to = event.address.toHexString();
    repay.from = event.params.payer.toHexString(); //dataSource.address().toHexString()
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;
    repay.market = event.address.toHexString();
    repay.asset = getOrCreateUnderlyingToken(event.address).id;
    repay.amount = event.params.repayAmount;
    repay.amountUSD = repay.amount.toBigDecimal().times(pricePerToken);

    repay.save();
  } else {
    log.warning("Repay {} already exists", [repayId]);
  }

  // update usage metric
  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyRepayCount += 1;
  usageDailyMetrics.dailyTransactionCount += 1;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyRepayCount += 1;
  usageHourlyMetrics.hourlyTransactionCount += 1;
  usageHourlyMetrics.save();
}

export function updateLiquidate(event: LiquidateBorrow): void {
  let liquidateId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let liquidate = Liquidate.load(liquidateId);

  let pricePerUnderlyingToken = getUnderlyingTokenPricePerAmount(event.address);
  let pricePerCollateralToken = getUnderlyingTokenPricePerAmount(event.params.cTokenCollateral);
  // get exchangeRate for collateral token
  let collateralMarketId = event.params.cTokenCollateral.toHexString();
  let collateralMarket = getOrCreateMarket(collateralMarketId, event);
  let exchangeRate = collateralMarket.exchangeRate;
  let liquidateAmount = event.params.seizeTokens;
  let liquidateAmountUSD = liquidateAmount
    .toBigDecimal()
    .times(exchangeRate!)
    .times(pricePerCollateralToken);

  if (liquidate == null) {
    liquidate = new Liquidate(liquidateId);

    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.logIndex = event.transactionLogIndex.toI32();
    liquidate.protocol = FACTORY_ADDRESS;
    liquidate.to = event.address.toHexString();
    liquidate.from = event.params.liquidator.toHexString();
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;
    liquidate.market = event.address.toHexString();
    liquidate.asset = event.params.cTokenCollateral.toHexString();
    liquidate.amount = liquidateAmount;
    liquidate.amountUSD = liquidateAmountUSD;
    let repayAmountUSD = event.params.repayAmount.toBigDecimal().times(pricePerUnderlyingToken);

    liquidate.profitUSD = liquidate.amountUSD!.minus(repayAmountUSD);

    liquidate.save();
  } else {
    log.warning("Liquidate {} already exists", [liquidateId]);
  }

  // update market.cumulativeLiquidateUSD
  let marketId = event.address.toHexString();
  let market = getOrCreateMarket(marketId, event);
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidateAmountUSD);
  market.save();

  // update protocol.cumulativeLiquidateUSD
  let protocol = getOrCreateProtocol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidateAmountUSD);
  protocol.save();

  // update MarketDailySnapshot
  //      - dailyLiquidateUSD
  //      - cumulativeLiquidateUSD
  let marketDaily = getOrCreateMarketDailySnapshot(event);
  marketDaily.dailyLiquidateUSD = marketDaily.dailyLiquidateUSD.plus(liquidateAmountUSD);
  marketDaily.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDaily.blockNumber = event.block.number;
  marketDaily.timestamp = event.block.timestamp;
  marketDaily.save();

  // update MarketHourlySnapshot
  //      - hourlyLiquidateUSD
  //      - cumulativeLiquidateUSD
  let marketHourly = getOrCreateMarketHourlySnapshot(event);
  marketHourly.hourlyLiquidateUSD = marketDaily.dailyLiquidateUSD.plus(liquidateAmountUSD);
  marketHourly.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourly.blockNumber = event.block.number;
  marketHourly.timestamp = event.block.timestamp;
  marketHourly.save();

  // update FinancialsDailySnapshot
  //      - dailyLiquidateUSD
  //      - cumulativeLiquidateUSD
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyLiquidateUSD = financialMetrics.dailyLiquidateUSD.plus(liquidateAmountUSD);
  financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.save();

  // update usage metric
  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyLiquidateCount += 1;
  usageDailyMetrics.dailyTransactionCount += 1;
  usageDailyMetrics.blockNumber = event.block.number;
  usageDailyMetrics.timestamp = event.block.timestamp;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyLiquidateCount += 1;
  usageHourlyMetrics.hourlyTransactionCount += 1;
  usageHourlyMetrics.blockNumber = event.block.number;
  usageHourlyMetrics.timestamp = event.block.timestamp;
  usageHourlyMetrics.save();
}

// Update
//    - UsageMetricsDailySnapshots
//    - UsageMetricsHourlySnapshot
//    - LendingProtocol.cumulativeUniqueUsers
export function updateUsageMetrics(event: ethereum.Event, user: Address): void {
  // Days since Unix epoch time
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  // Hours since Unix epoch time
  let hours = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let accountId: string = user.toHexString();
  let dailyActiveAccountId: string = "daily-" + accountId + "-" + days.toString();
  let hourlyActiveAccountId: string = "hourly-" + accountId + "-" + "-" + hours.toString();

  // Account entity keeps user addresses
  let isNewUniqueUser = createAndIncrementAccount(accountId);
  let isNewDailyActiveUser = createAndIncrementActiveAccount(dailyActiveAccountId);
  let isNewHourlyActiveUser = createAndIncrementActiveAccount(hourlyActiveAccountId);

  // update LendingProtocol.cumulativeUniqueUsers
  let protocol = getOrCreateProtocol();
  if (protocol == null) {
    log.error("LendingProtocol entity is null{}; something went wrong", [""]);
  }
  protocol.cumulativeUniqueUsers += isNewUniqueUser;
  protocol.save();

  let usageDailyMetrics = getOrCreateUsageMetricsDailySnapshot(event);
  usageDailyMetrics.dailyActiveUsers += isNewDailyActiveUser;
  usageDailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  //usageDailyMetrics.dailyTransactionCount += 1; //increment whenever updateUsageMetrics is called
  // Update the block number and timestamp to that of the last transaction of that day
  usageDailyMetrics.blockNumber = event.block.number;
  usageDailyMetrics.timestamp = event.block.timestamp;
  usageDailyMetrics.save();

  let usageHourlyMetrics = getOrCreateUsageMetricsHourlySnapshot(event);
  usageHourlyMetrics.hourlyActiveUsers += isNewHourlyActiveUser;
  usageHourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageHourlyMetrics.hourlyTransactionCount += 1; //increment whenever updateUsageMetrics is called
  // Update the block number and timestamp to that of the last transaction of that day
  usageHourlyMetrics.blockNumber = event.block.number;
  usageHourlyMetrics.timestamp = event.block.timestamp;
  usageHourlyMetrics.save();
}

export function updateRevenue(
  event: ethereum.Event,
  newProtocolRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateProtocol();
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
    protocol.cumulativeProtocolSideRevenueUSD,
  );
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    newProtocolRevenueUSD,
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailyTotalRevenueUSD.minus(
    financialMetrics.dailyProtocolSideRevenueUSD,
  );

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// Add fees from Stablizer to protocolSideRevenue and totalRevenue
//    - protocol.cumulativeProtocolSideRevenueUSD
//    - protocol.cumulativeTotalRevenueUSD
//    - FinancialsDailySnapshot.dailyProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.dailyTotalRevenueUSD
//    - FinancialsDailySnapshot.cumulativeTotalRevenueUSD
export function updateStablizerFees(fees: BigDecimal, event: ethereum.Event): void {
  let protocol = getOrCreateProtocol();
  let cumulativePRev = protocol.cumulativeProtocolSideRevenueUSD;
  let cumulativeTRev = protocol.cumulativeTotalRevenueUSD;
  cumulativePRev = cumulativePRev.plus(fees);
  cumulativeTRev = cumulativeTRev.plus(fees);

  protocol.cumulativeProtocolSideRevenueUSD = cumulativePRev;
  protocol.cumulativeTotalRevenueUSD = cumulativeTRev;
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.cumulativeProtocolSideRevenueUSD = cumulativePRev;
  financialMetrics.cumulativeTotalRevenueUSD = cumulativeTRev;
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(fees);
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(fees);
  financialMetrics.save();
}

// Update MarketDailySnapshot and MarketHourlySnapshot
export function updateMarketMetrics(event: ethereum.Event): void {
  let marketId = event.address.toHexString();
  let market = getOrCreateMarket(marketId, event);

  let marketDaily = getOrCreateMarketDailySnapshot(event);

  // use market entity to update MarketMetrics
  marketDaily.rates = market.rates;
  marketDaily.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDaily.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDaily.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDaily.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDaily.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDaily.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketDaily.inputTokenBalance = market.inputTokenBalance;
  marketDaily.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketDaily.outputTokenSupply = market.outputTokenSupply;
  marketDaily.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketDaily.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketDaily.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketDaily.exchangeRate = market.exchangeRate;

  // Update the block number and timestamp to that of the last transaction of that day
  marketDaily.blockNumber = event.block.number;
  marketDaily.timestamp = event.block.timestamp;

  marketDaily.save();

  let marketHourly = getOrCreateMarketHourlySnapshot(event);

  // use market entity to update MarketMetrics
  marketHourly.rates = market.rates;
  marketHourly.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourly.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourly.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourly.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourly.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourly.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketHourly.inputTokenBalance = market.inputTokenBalance;
  marketHourly.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketHourly.outputTokenSupply = market.outputTokenSupply;
  marketHourly.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketHourly.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketHourly.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketHourly.exchangeRate = market.exchangeRate;

  // Update the block number and timestamp to that of the last transaction of that day
  marketHourly.blockNumber = event.block.number;
  marketHourly.timestamp = event.block.timestamp;

  marketHourly.save();
}

// Update Market entity
export function updateMarket(event: ethereum.Event, borrowAmount: BigInt = BIGINT_ZERO): void {
  // event must be emitted by a CToken/Market contract
  let marketId = event.address.toHexString();
  // alternatively, get marketId from dataSource.address
  let markets = Factory.bind(Address.fromString(FACTORY_ADDRESS)).getAllMarkets();
  assert(markets.includes(event.address), "Event not emitted by a CToken contract");

  let market = getOrCreateMarket(marketId, event);
  if (market != null) {
    let tokenContract = CErc20.bind(event.address);

    // To get the price of the underlying (input) token
    let inputTokenPriceUSD = getUnderlyingTokenPrice(event.address);
    let decimals = getOrCreateUnderlyingToken(event.address).decimals;
    let inputTokenPriceUSDperAmount = inputTokenPriceUSD.div(decimalsToBigDecimal(decimals));
    let inputTokenBalance = tokenContract.getCash();
    market.inputTokenBalance = inputTokenBalance;
    market.inputTokenPriceUSD = inputTokenPriceUSD;
    market.outputTokenSupply = tokenContract.totalSupply();

    market.totalDepositBalanceUSD = inputTokenBalance.toBigDecimal().times(inputTokenPriceUSDperAmount);
    market.totalValueLockedUSD = market.totalDepositBalanceUSD;

    // Needs to use try_totalBorrows() as some market doesn't have totalBorows & default to BIGDECIMAL_ZERO
    let tryTotalBorrows = tokenContract.try_totalBorrows();
    if (tryTotalBorrows.reverted) {
      log.warning("Failed to get totalBorrows for market {} at tx hash {}; Not updating Market.totalBorrowBalanceUSD", [
        marketId,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      market.totalBorrowBalanceUSD = tryTotalBorrows.value.toBigDecimal().times(inputTokenPriceUSDperAmount);
    }

    let tryExchangeRate = tokenContract.try_exchangeRateCurrent();
    if (tryExchangeRate.reverted) {
      log.warning("Failed to get exchangeRate for market {} at tx hash {}; Not updating Market.exchangeRate", [
        marketId,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      market.exchangeRate = tryExchangeRate.value.toBigDecimal().div(decimalsToBigDecimal(MANTISSA_DECIMALS));
    }

    // derive outputToken (cToken) price from exchange rate and inputTokenPriceUSD
    if (market.exchangeRate) {
      market.outputTokenPriceUSD = inputTokenPriceUSD.div(market.exchangeRate!);
    }

    //
    //RewardEmission are updated in updateMarketEmission() &
    // triggered by comptroller.DistributedBorrowerComp and
    // DistributedSupplierComp
    //market.rewardTokenEmissionsAmount
    //market.rewardTokenEmissionsUSD

    market.save();
  } else {
    log.error("Market {} does not exist", [marketId]);
  }
}

// Iterate all markets & update aggregated quantities
//    - LendindProtocol
//    - FinancialsDailySnapshot
export function aggregateAllMarkets(event: ethereum.Event): void {
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let marketAddrs = factoryContract.getAllMarkets();

  // iterate over AllMarkets
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString();
    let market = Market.load(marketId);

    if (market != null) {
      totalDepositBalanceUSD = totalDepositBalanceUSD.plus(market.totalDepositBalanceUSD);
      totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(market.totalBorrowBalanceUSD);
    }
  }

  let protocol = getOrCreateProtocol();
  if (protocol == null) {
    log.error("LendingProtocol entity is empty {}; something went wrong", [""]);
  }

  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.totalDepositBalanceUSD = totalDepositBalanceUSD;
  financialMetrics.totalValueLockedUSD = totalDepositBalanceUSD;
  financialMetrics.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.save();
}

export function updateMarketEmission(marketId: string, newEmissionAmount: BigInt[], event: ethereum.Event): void {
  let market = getOrCreateMarket(marketId, event);
  if (market == null) {
    log.error("Market {} does not exist.", [marketId]);
    return;
  }

  let pricePerToken = getUnderlyingTokenPricePerAmount(Address.fromString(XINV_ADDRESS));

  // Retrieve & store last block number to calculate deltaBlocks & approximate normalized daily emissions
  // This is not exactly how inverse-finance actually calculate emissions (COMP), but a reasonable approximation
  // The contract uses deltaIndex & multiplies it with the borrow/deposit amount (comptroller.sol Line 1107-1150)
  // The deltaIndex is tied to deltaBlocks (comptroller.sol Line 1084-1105) & compSpeed
  let lastBlockNumbers = [EMISSION_START_BLOCK, EMISSION_START_BLOCK]; // Creation of factory
  let lastBlockStore = _HelperStore.load("lastBlockNumber");
  if (lastBlockStore != null && lastBlockStore.valueBigIntArray.length > 0) {
    lastBlockNumbers = lastBlockStore.valueBigIntArray;
  } else {
    lastBlockStore = new _HelperStore("lastBlockNumber");
    lastBlockStore.valueBigIntArray = lastBlockNumbers;
    lastBlockStore.save();
  }

  let rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount!;
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!;
  let deltaBlocks: BigInt;
  for (let i = 0; i < newEmissionAmount.length; i++) {
    if (newEmissionAmount[i] != BIGINT_ZERO) {
      let lastBlockNumber = lastBlockNumbers[i];
      assert(
        lastBlockNumber >= EMISSION_START_BLOCK,
        "last block number should be larger than " + EMISSION_START_BLOCK.toString(),
      );
      deltaBlocks = event.block.number.minus(lastBlockNumber).plus(BIGINT_ONE);
      let dailyEmissionsAmount = newEmissionAmount[i]
        .toBigDecimal()
        .div(deltaBlocks.toBigDecimal())
        .times(BLOCKS_PER_DAY);
      let dailyEmissionsUSD = dailyEmissionsAmount.times(pricePerToken);
      rewardTokenEmissionsAmount[i] = BigDecimalTruncateToBigInt(dailyEmissionsAmount);
      log.info("Market {} emissions {} ({}) at tx hash {}", [
        marketId,
        dailyEmissionsAmount.toString(),
        BigDecimalTruncateToBigInt(dailyEmissionsAmount).toString(),
        event.transaction.hash.toHexString(),
      ]);
      rewardTokenEmissionsUSD[i] = dailyEmissionsUSD;

      lastBlockNumbers[i] = event.block.number;
    }
  }
  market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  market.save();

  lastBlockStore.valueBigIntArray = lastBlockNumbers;
  lastBlockStore.save();
}

// Update InterestRate entity
export function updateInterestRates(event: ethereum.Event): void {
  let marketId = event.address.toHexString();
  log.info("Updating rates for Market {} at tx hash {} ...", [marketId, event.transaction.hash.toHexString()]);

  let borrowerInterestRate = getOrCreateInterestRate(marketId, InterestRateSide.BORROWER, InterestRateType.VARIABLE);
  let lenderInterestRate = getOrCreateInterestRate(marketId, InterestRateSide.LENDER, InterestRateType.VARIABLE);
  if (borrowerInterestRate == null) {
    log.error("Borrower InterestRate for market {} does not exist.", [marketId]);
  }
  if (lenderInterestRate == null) {
    log.error("Lender InterestRate for market {} does not exist.", [marketId]);
  }

  let tokenContract = CErc20.bind(event.address);
  let tryBorrowRate = tokenContract.try_borrowRatePerBlock();
  let tryDepositRate = tokenContract.try_supplyRatePerBlock();
  if (tryBorrowRate.reverted) {
    log.warning("Failed to get borrowRatePerBlock() for Market {} at tx hash {}", [
      marketId,
      event.transaction.hash.toHexString(),
    ]);
  } else {
    borrowerInterestRate.rate = tryBorrowRate.value
      .toBigDecimal()
      .times(BLOCKS_PER_YEAR)
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
      .times(BIGDECIMAL_HUNDRED);
  }
  if (tryDepositRate.reverted) {
    log.warning("Failed to get supplyRatePerBlock() for Market {} at tx hash {}", [
      marketId,
      event.transaction.hash.toHexString(),
    ]);
  } else {
    lenderInterestRate.rate = tryDepositRate.value
      .toBigDecimal()
      .times(BLOCKS_PER_YEAR)
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
      .times(BIGDECIMAL_HUNDRED);
  }

  borrowerInterestRate.save();
  lenderInterestRate.save();
}
