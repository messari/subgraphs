import {
  Address,
  BigDecimal,
  ethereum,
  BigInt,
  log,
  Entity,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateMarket,
  getOrCreateInterestRate,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancials,
  getSnapshotRates,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
  getOrCreateAccount,
  getOrCreateFinancialsDailySnapshot,
} from "./getters";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  InterestRateSide,
  InterestRateType,
  SECONDS_PER_YEAR,
  BIGDECIMAL_HUNDRED,
  SECONDS_PER_DAY,
  INT_ZERO,
  INT_ONE,
} from "./constants";
import { bigIntToBDUseDecimals } from "./utils";
import { LendingProtocol, Market } from "../../generated/schema";
import {
  Account,
  ActiveAccount,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Borrow,
  Repay,
  Deposit,
  Withdraw,
} from "../../generated/schema";
import { ActivityType, SECONDS_PER_HOUR, TransactionType } from "./constants";

export function createTransaction(
  transactionType: string,
  market: Market,
  accountID: string,
  positionID: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): void {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity: Borrow | Deposit | Repay | Withdraw;
  if (transactionType == TransactionType.BORROW) {
    entity = new Borrow(id);
  } else if (transactionType == TransactionType.DEPOSIT) {
    entity = new Deposit(id);
  } else if (transactionType == TransactionType.REPAY) {
    entity = new Repay(id);
  } else if (transactionType == TransactionType.WITHDRAW) {
    entity = new Withdraw(id);
  } else {
    log.error("[createTransaction]Unknown transaction type {}", [
      transactionType,
    ]);
    return;
  }

  entity.hash = hash;
  entity.logIndex = logIndex.toI32();
  entity.nonce = event.transaction.nonce;
  entity.market = market.id;
  entity.asset = market.inputToken;
  entity.account = accountID;
  entity.position = positionID;
  entity.amount = amount;
  entity.amountUSD = amountUSD;
  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.timestamp;

  entity.save();
}

export function updatePrices(
  execProxyAddress: Address,
  market: Market,
  event: ethereum.Event
): BigDecimal | null {
  const underlying = Address.fromString(market.inputToken);
  // update price
  const execProxyContract = Exec.bind(execProxyAddress);
  const blockNumber = event.block.number;
  const underlyingPriceWETHResult =
    execProxyContract.try_getPriceFull(underlying);
  // this is the inversion of WETH price in USD
  const USDCPriceWETHResult = execProxyContract.try_getPriceFull(
    Address.fromString(USDC_ERC20_ADDRESS)
  );
  if (underlyingPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", [
      underlying.toHexString(),
      blockNumber.toString(),
    ]);
    return null;
  }

  if (USDCPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", [
      "USDC",
      blockNumber.toString(),
    ]);
    return null;
  }

  const underlyingPriceUSD = underlyingPriceWETHResult.value
    .getCurrPrice()
    .divDecimal(USDCPriceWETHResult.value.getCurrPrice().toBigDecimal());

  const token = getOrCreateToken(underlying);
  token.lastPriceUSD = underlyingPriceUSD;
  token.lastPriceBlockNumber = blockNumber;
  token.save();

  market.inputTokenPriceUSD = underlyingPriceUSD;
  if (market.exchangeRate && market.exchangeRate!.gt(BIGDECIMAL_ZERO)) {
    market.outputTokenPriceUSD = underlyingPriceUSD.div(market.exchangeRate!);
  }
  market.save();

  const eToken = getOrCreateToken(Address.fromString(market.outputToken!));
  eToken.lastPriceUSD = market.outputTokenPriceUSD;
  eToken.lastPriceBlockNumber = blockNumber;
  eToken.save();

  if (market._dToken && market._dTokenExchangeRate!.gt(BIGDECIMAL_ZERO)) {
    const dToken = getOrCreateToken(Address.fromString(market._dToken!));
    dToken.lastPriceUSD = underlyingPriceUSD.div(market._dTokenExchangeRate!);
    dToken.lastPriceBlockNumber = blockNumber;
    dToken.save();
  }

  return underlyingPriceUSD;
}

export function updateInterestRates(
  market: Market,
  interestRate: BigInt,
  reserveFee: BigInt,
  totalentitys: BigInt,
  totalBalances: BigInt,
  event: ethereum.Event
): void {
  // interestRate is entity Rate in Second Percentage Yield
  // See computeAPYs() in EulerGeneralView.sol
  const entitySPY = interestRate;
  const entityAPY = bigDecimalExponential(
    entitySPY.divDecimal(INTEREST_RATE_DECIMALS),
    SECONDS_PER_YEAR
  ).minus(BIGDECIMAL_ONE);
  const supplySideShare = BIGDECIMAL_ONE.minus(
    reserveFee.divDecimal(RESERVE_FEE_SCALE)
  );
  const supplySPY = interestRate
    .times(totalentitys)
    .toBigDecimal()
    .times(supplySideShare)
    .div(totalBalances.toBigDecimal());
  const supplyAPY = bigDecimalExponential(
    supplySPY.div(INTEREST_RATE_DECIMALS),
    SECONDS_PER_YEAR
  ).minus(BIGDECIMAL_ONE);

  const entityerRate = getOrCreateInterestRate(
    InterestRateSide.entityER,
    InterestRateType.VARIABLE,
    market.id
  );
  entityerRate.rate = entityAPY.times(BIGDECIMAL_HUNDRED);
  entityerRate.save();
  const lenderRate = getOrCreateInterestRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    market.id
  );
  lenderRate.rate = supplyAPY.times(BIGDECIMAL_HUNDRED);
  lenderRate.save();
  market.rates = [entityerRate.id, lenderRate.id];
  market.save();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(market.id, event);
  const days = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketDailySnapshot.rates = getSnapshotRates(market.rates, days);
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketDailySnapshot(market.id, event);
  const hours = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketHourlySnapshot.rates = getSnapshotRates(market.rates, hours);
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;
  marketHourlySnapshot.save();
}

export function updateRevenues(
  protocol: LendingProtocol,
  market: Market,
  newSupplySideRevenueUSD: BigDecimal,
  newProtocolSideRevenueUSD: BigDecimal,
  event: ethereum.Event,
  updateProtocol: bool = true // whether to update protocol level revenues; false for senior pool to avoid double counting revenues
): void {
  const newTotalRevenueUSD = newSupplySideRevenueUSD.plus(
    newProtocolSideRevenueUSD
  );
  // update market's revenue
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(market.id, event);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    market.id,
    event
  );

  // update daily snapshot
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      newProtocolSideRevenueUSD
    );
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  marketDailySnapshot.save();

  // update hourly snapshot
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD
    );
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      newProtocolSideRevenueUSD
    );
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
  marketHourlySnapshot.save();

  // update protocol revenue
  if (updateProtocol) {
    protocol.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
    protocol.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
    protocol.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
    protocol.save();

    const financialSnapshot = getOrCreateFinancialsDailySnapshot(event);
    // update financials
    financialSnapshot.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialSnapshot.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialSnapshot.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;
    financialSnapshot.dailySupplySideRevenueUSD =
      financialSnapshot.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
    financialSnapshot.dailyProtocolSideRevenueUSD =
      financialSnapshot.dailyProtocolSideRevenueUSD.plus(
        newProtocolSideRevenueUSD
      );
    financialSnapshot.dailyTotalRevenueUSD =
      financialSnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
    financialSnapshot.save();
  }
}

// updates the FinancialDailySnapshot Entity
export function snapshotFinancials(
  protocol: LendingProtocol,
  amountUSD: BigDecimal,
  event: ethereum.Event,
  transactionType: string | null = null
): void {
  const block = event.block;
  const financialMetrics = getOrCreateFinancials(block.timestamp, block.number);

  if (block.number.ge(financialMetrics.blockNumber)) {
    // financials snapshot already exists and is stale, refresh
    if (!protocol) protocol = getOrCreateLendingProtocol();
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

    // update cumul revenues
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;
  }

  // update the block number and timestamp
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  if (transactionType != null) {
    // add to daily amounts
    if (transactionType == TransactionType.DEPOSIT) {
      financialMetrics.dailyDepositUSD =
        financialMetrics.dailyDepositUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.BORROW) {
      financialMetrics.dailyBorrowUSD =
        financialMetrics.dailyBorrowUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.REPAY) {
      financialMetrics.dailyRepayUSD =
        financialMetrics.dailyRepayUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.WITHDRAW) {
      financialMetrics.dailyWithdrawUSD =
        financialMetrics.dailyWithdrawUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.LIQUIDATE) {
      financialMetrics.dailyLiquidateUSD =
        financialMetrics.dailyLiquidateUSD.plus(amountUSD);
    }
  }

  financialMetrics.save();
}

// update daily/hourly Usage Metric Snapshot
export function updateUsageMetrics(
  protocol: LendingProtocol,
  user: string,
  event: ethereum.Event,
  transactionType: string
): void {
  // Number of days since Unix epoch
  const days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const hours: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const dailyMetrics = getOrCreateUsageDailySnapshot(event);
  const hourlyMetrics = getOrCreateUsageHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = event.block.number;
  dailyMetrics.timestamp = event.block.timestamp;
  dailyMetrics.dailyTransactionCount += INT_ONE;

  // update hourlyMetrics
  hourlyMetrics.blockNumber = event.block.number;
  hourlyMetrics.timestamp = event.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += INT_ONE;

  let account = Account.load(user);
  if (!account) {
    account = getOrCreateAccount(user);
    protocol.cumulativeUniqueUsers += INT_ONE;
  }
  if (transactionType == TransactionType.DEPOSIT) {
    if (account.depositCount == INT_ZERO)
      protocol.cumulativeUniqueDepositors += INT_ONE;
    account.depositCount += INT_ONE;
  } else if (transactionType == TransactionType.WITHDRAW) {
    account.withdrawCount += INT_ONE;
  } else if (transactionType == TransactionType.BORROW) {
    if (account.borrowCount == INT_ZERO)
      protocol.cumulativeUniqueBorrowers += INT_ONE;
    account.borrowCount += INT_ONE;
  } else if (transactionType == TransactionType.REPAY) {
    account.repayCount += INT_ONE;
  }
  account.save();

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId =
    ActivityType.DAILY + "-" + user + "-" + days.toString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    dailyMetrics.dailyActiveUsers += INT_ONE;
  }

  // create active account for hourlyMetrics
  const hourlyActiveAccountId =
    ActivityType.HOURLY + "-" + user + "-" + hours.toString();
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    hourlyMetrics.hourlyActiveUsers += INT_ONE;
  }

  // update transaction for daily/hourly metrics
  updateTransactionCount(dailyMetrics, hourlyMetrics, transactionType);

  dailyMetrics.totalPoolCount = protocol.totalPoolCount;
  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.cumulativeUniqueDepositors = protocol.cumulativeUniqueDepositors;
  dailyMetrics.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  hourlyMetrics.save();
  dailyMetrics.save();
  protocol.save();
}

// update MarketDailySnapshot & MarketHourlySnapshot
export function snapshotMarket(
  market: Market,
  amountUSD: BigDecimal,
  event: ethereum.Event,
  transactionType: string | null = null,
  snapshotRates: bool = false
): void {
  const marketDailyMetrics = getOrCreateMarketDailySnapshot(market.id, event);
  const marketHourlyMetrics = getOrCreateMarketHourlySnapshot(market.id, event);

  marketDailyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailyMetrics.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketDailyMetrics.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketDailyMetrics.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketDailyMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailyMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailyMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailyMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailyMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailyMetrics.inputTokenBalance = market.inputTokenBalance;
  marketDailyMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketDailyMetrics.outputTokenSupply = market.outputTokenSupply;
  marketDailyMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketDailyMetrics.exchangeRate = market.exchangeRate;
  marketDailyMetrics.rewardTokenEmissionsAmount =
    market.rewardTokenEmissionsAmount;
  marketDailyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketHourlyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlyMetrics.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketHourlyMetrics.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketHourlyMetrics.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketHourlyMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlyMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlyMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlyMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlyMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlyMetrics.inputTokenBalance = market.inputTokenBalance;
  marketHourlyMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketHourlyMetrics.outputTokenSupply = market.outputTokenSupply;
  marketHourlyMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketHourlyMetrics.exchangeRate = market.exchangeRate;
  marketHourlyMetrics.rewardTokenEmissionsAmount =
    market.rewardTokenEmissionsAmount;
  marketHourlyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  // update to latest block/timestamp
  marketDailyMetrics.blockNumber = event.block.number;
  marketDailyMetrics.timestamp = event.block.timestamp;
  marketHourlyMetrics.blockNumber = event.block.number;
  marketHourlyMetrics.timestamp = event.block.timestamp;

  // add to daily amounts
  if (transactionType != null) {
    if (transactionType == TransactionType.DEPOSIT) {
      marketDailyMetrics.dailyDepositUSD =
        marketDailyMetrics.dailyDepositUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyDepositUSD =
        marketHourlyMetrics.hourlyDepositUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.BORROW) {
      marketDailyMetrics.dailyBorrowUSD =
        marketDailyMetrics.dailyBorrowUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyBorrowUSD =
        marketHourlyMetrics.hourlyBorrowUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.REPAY) {
      marketDailyMetrics.dailyRepayUSD =
        marketDailyMetrics.dailyRepayUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyRepayUSD =
        marketHourlyMetrics.hourlyRepayUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.WITHDRAW) {
      marketDailyMetrics.dailyWithdrawUSD =
        marketDailyMetrics.dailyWithdrawUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyWithdrawUSD =
        marketHourlyMetrics.hourlyWithdrawUSD.plus(amountUSD);
    } else if (transactionType == TransactionType.LIQUIDATE) {
      marketDailyMetrics.dailyLiquidateUSD =
        marketDailyMetrics.dailyLiquidateUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyLiquidateUSD =
        marketHourlyMetrics.hourlyLiquidateUSD.plus(amountUSD);
    }
  }

  if (snapshotRates) {
    const days = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
    const hours = (event.block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
    marketDailyMetrics.rates = getSnapshotRates(market.rates, days);
    marketHourlyMetrics.rates = getSnapshotRates(market.rates, hours);
  }

  marketDailyMetrics.save();
  marketHourlyMetrics.save();
}

/////////////////
//// Helpers ////
/////////////////

function updateTransactionCount(
  dailyUsage: UsageMetricsDailySnapshot,
  hourlyUsage: UsageMetricsHourlySnapshot,
  transactionType: string
): void {
  if (transactionType == TransactionType.DEPOSIT) {
    hourlyUsage.hourlyDepositCount += 1;
    dailyUsage.dailyDepositCount += 1;
  } else if (transactionType == TransactionType.WITHDRAW) {
    hourlyUsage.hourlyWithdrawCount += 1;
    dailyUsage.dailyWithdrawCount += 1;
  } else if (transactionType == TransactionType.BORROW) {
    hourlyUsage.hourlyBorrowCount += 1;
    dailyUsage.dailyBorrowCount += 1;
  } else if (transactionType == TransactionType.REPAY) {
    hourlyUsage.hourlyRepayCount += 1;
    dailyUsage.dailyRepayCount += 1;
  } else if (transactionType == TransactionType.LIQUIDATE) {
    hourlyUsage.hourlyLiquidateCount += 1;
    dailyUsage.dailyLiquidateCount += 1;
  }

  hourlyUsage.save();
  dailyUsage.save();
}
