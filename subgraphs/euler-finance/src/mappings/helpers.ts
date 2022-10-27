import { Address, BigDecimal, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { Borrow, Deposit, Liquidation, Repay, Withdraw } from "../../generated/euler/Euler";
import {
  getOrCreateDeposit,
  getOrCreateToken,
  getOrCreateMarket,
  getOrCreateInterestRate,
  getOrCreateWithdraw,
  getOrCreateBorrow,
  getOrCreateLendingProtocol,
  getOrCreateLiquidate,
  getOrCreateRepay,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancials,
  getSnapshotRates,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
  getOrCreateAssetStatus,
} from "../common/getters";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  InterestRateSide,
  InterestRateType,
  DECIMAL_PRECISION,
  SECONDS_PER_YEAR,
  RESERVE_FEE_SCALE,
  CRYPTEX_MARKET_ID,
  INTEREST_RATE_DECIMALS,
  BIGDECIMAL_HUNDRED,
  USDC_ERC20_ADDRESS,
  SECONDS_PER_DAY,
  DEFAULT_DECIMALS,
  UNDERLYING_RESERVES_FEE,
} from "../common/constants";
import { bigIntChangeDecimals, bigIntToBDUseDecimals } from "../common/conversions";
import { LendingProtocol, Market, _AssetStatus } from "../../generated/schema";
import { Exec } from "../../generated/euler/Exec";
import { bigDecimalExponential } from "../common/conversions";
import { Account, ActiveAccount, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from "../../generated/schema";
import { ActivityType, SECONDS_PER_HOUR, TransactionType } from "../common/constants";

export function createBorrow(event: Borrow): BigDecimal {
  const borrow = getOrCreateBorrow(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const accountAddress = event.params.account.toHexString();

  const underlyingToken = getOrCreateToken(event.params.underlying);
  borrow.market = marketId;
  borrow.asset = underlying;
  borrow.from = marketId;
  borrow.to = accountAddress;
  borrow.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);

  // catch CRYPTEX outlier price at block 15358330
  // see transaction: https://etherscan.io/tx/0x77885d38a6c496fdc39675f57185ab8bb11e8d1f14eb9f4a536fc1c4d24d84d2
  if (
    underlying.toLowerCase() == CRYPTEX_MARKET_ID.toLowerCase() &&
    event.block.number.equals(BigInt.fromI32(15358330))
  ) {
    // this is the price of CTX on August 17, 2022 at 11AM UTC-0
    // see: https://www.coingecko.com/en/coins/cryptex-finance
    const CTX_PRICE = BigDecimal.fromString("3.98");
    borrow.amountUSD = event.params.amount.toBigDecimal().div(DECIMAL_PRECISION).times(CTX_PRICE);
  } else {
    borrow.amountUSD = bigIntToBDUseDecimals(borrow.amount, underlyingToken.decimals).times(
      underlyingToken.lastPriceUSD!,
    );
  }

  borrow.save();

  const market = getOrCreateMarket(marketId);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD);
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD);
  protocol.save();

  return borrow.amountUSD;
}

export function createDeposit(event: Deposit): BigDecimal {
  const deposit = getOrCreateDeposit(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const accountAddress = event.params.account;

  const underlyingToken = getOrCreateToken(event.params.underlying);
  deposit.market = marketId;
  deposit.asset = underlying;
  deposit.from = accountAddress.toHexString();
  deposit.to = marketId;
  deposit.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  deposit.amountUSD = bigIntToBDUseDecimals(deposit.amount, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );

  deposit.save();

  const market = getOrCreateMarket(marketId);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deposit.amountUSD);
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deposit.amountUSD);
  protocol.save();

  return deposit.amountUSD;
}

export function createRepay(event: Repay): BigDecimal {
  const repay = getOrCreateRepay(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const accountAddress = event.params.account;
  const market = getOrCreateMarket(marketId);

  const underlyingToken = getOrCreateToken(event.params.underlying);
  repay.market = marketId;
  repay.asset = underlying;
  repay.from = accountAddress.toHexString();
  repay.to = marketId;
  repay.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  repay.amountUSD = bigIntToBDUseDecimals(repay.amount, underlyingToken.decimals).times(underlyingToken.lastPriceUSD!);

  repay.save();
  market.save();

  return repay.amountUSD;
}

export function createWithdraw(event: Withdraw): BigDecimal {
  const withdraw = getOrCreateWithdraw(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const accountAddress = event.params.account;

  const underlyingToken = getOrCreateToken(event.params.underlying);
  withdraw.market = marketId;
  withdraw.asset = underlying;
  withdraw.from = marketId;
  withdraw.to = accountAddress.toHexString();
  withdraw.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  withdraw.amountUSD = bigIntToBDUseDecimals(withdraw.amount, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );

  withdraw.save();

  return withdraw.amountUSD;
}

export function createLiquidation(event: Liquidation): BigDecimal {
  const liquidation = getOrCreateLiquidate(event);
  const underlyingTokenId = event.params.underlying.toHexString();
  const seizedTokenId = event.params.collateral.toHexString();

  const underlyingToken = getOrCreateToken(event.params.underlying);
  const seizedToken = getOrCreateToken(event.params.collateral);

  // repay token market
  const underlyingAssetStatus = getOrCreateAssetStatus(underlyingTokenId);
  const collateralAssetStatus = getOrCreateAssetStatus(seizedTokenId);
  const market = getOrCreateMarket(underlyingAssetStatus.eToken!);
  const collateralMarket = getOrCreateMarket(collateralAssetStatus.eToken!);

  liquidation.market = collateralMarket.id;
  liquidation.asset = underlyingTokenId;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.to = market.id; // Market that tokens are repaid to
  liquidation.liquidatee = event.params.violator.toHexString();
  // Amount of collateral liquidated in native units (schema definition)
  // Amount is denominated in collateral
  liquidation.amount = bigIntChangeDecimals(event.params._yield, DEFAULT_DECIMALS, seizedToken.decimals);
  liquidation.amountUSD = bigIntToBDUseDecimals(liquidation.amount, seizedToken.decimals).times(
    seizedToken.lastPriceUSD!,
  );

  const repayUSD = bigIntToBDUseDecimals(event.params.repay, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );
  liquidation.profitUSD = liquidation.amountUSD.minus(repayUSD);
  liquidation.save();

  collateralMarket.cumulativeLiquidateUSD = collateralMarket.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
  collateralMarket.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
  protocol.save();

  return liquidation.amountUSD;
}

export function updatePrices(execProxyAddress: Address, market: Market, event: ethereum.Event): BigDecimal | null {
  const underlying = Address.fromString(market.inputToken);
  // update price
  const execProxyContract = Exec.bind(execProxyAddress);
  const blockNumber = event.block.number;
  const underlyingPriceWETHResult = execProxyContract.try_getPriceFull(underlying);
  // this is the inversion of WETH price in USD
  const USDCPriceWETHResult = execProxyContract.try_getPriceFull(Address.fromString(USDC_ERC20_ADDRESS));
  if (underlyingPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", [
      underlying.toHexString(),
      blockNumber.toString(),
    ]);
    return null;
  }

  if (USDCPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", ["USDC", blockNumber.toString()]);
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
  totalBorrows: BigInt,
  totalBalances: BigInt,
  event: ethereum.Event,
): void {
  // interestRate is Borrow Rate in Second Percentage Yield
  // See computeAPYs() in EulerGeneralView.sol
  const borrowSPY = interestRate;
  const borrowAPY = bigDecimalExponential(borrowSPY.divDecimal(INTEREST_RATE_DECIMALS), SECONDS_PER_YEAR).minus(
    BIGDECIMAL_ONE,
  );
  const supplySideShare = BIGDECIMAL_ONE.minus(reserveFee.divDecimal(RESERVE_FEE_SCALE));
  const supplySPY = interestRate
    .times(totalBorrows)
    .toBigDecimal()
    .times(supplySideShare)
    .div(totalBalances.toBigDecimal());
  const supplyAPY = bigDecimalExponential(supplySPY.div(INTEREST_RATE_DECIMALS), SECONDS_PER_YEAR).minus(
    BIGDECIMAL_ONE,
  );

  const borrowerRate = getOrCreateInterestRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, market.id);
  borrowerRate.rate = borrowAPY.times(BIGDECIMAL_HUNDRED);
  borrowerRate.save();
  const lenderRate = getOrCreateInterestRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, market.id);
  lenderRate.rate = supplyAPY.times(BIGDECIMAL_HUNDRED);
  lenderRate.save();
  market.rates = [borrowerRate.id, lenderRate.id];
  market.save();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event.block, market.id);
  const days = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketDailySnapshot.rates = getSnapshotRates(market.rates, days);
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketDailySnapshot(event.block, market.id);
  const hours = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketHourlySnapshot.rates = getSnapshotRates(market.rates, hours);
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;
  marketHourlySnapshot.save();
}

export function updateRevenue(
  reserveBalance: BigInt,
  totalBalances: BigInt,
  totalBorrows: BigInt,
  protocol: LendingProtocol,
  market: Market,
  assetStatus: _AssetStatus,
  event: ethereum.Event,
): void {
  const marketId = market.id;
  const underlying = Address.fromString(market.inputToken);
  const block = event.block;
  const token = getOrCreateToken(underlying);

  const deltaReserveBalance = reserveBalance.minus(assetStatus.reserveBalance);

  const deltaProtocolSideRevenue = deltaReserveBalance
    .toBigDecimal()
    .times(market.exchangeRate!) // convert to underlying
    .div(DECIMAL_PRECISION)
    .times(token.lastPriceUSD!);

  // assume reserve fee is interest revenue
  // revenue from liquidation reserve fee is handled in rollbackRevenue()
  // because protocolSideRev = totalRev * reserveFee/RESERVE_FEE_SCALE
  // ==> totalRev = protocolSideRev * RESERVE_FEE_SCALE / reserveFee
  const deltaTotalRevenue = deltaProtocolSideRevenue
    .times(RESERVE_FEE_SCALE)
    .div(assetStatus.reserveFee.toBigDecimal());
  const deltaSupplySideRevenue = deltaTotalRevenue.minus(deltaProtocolSideRevenue);

  // update protocol revenue
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(deltaTotalRevenue);
  protocol.save();

  // update market's revenue
  market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  market.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(deltaTotalRevenue);
  market.save();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(block, marketId);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(block, marketId);
  const financialSnapshot = getOrCreateFinancials(block.timestamp, block.number);

  // update daily snapshot
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(deltaTotalRevenue);
  marketDailySnapshot.save();

  // update hourly snapshot
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(deltaTotalRevenue);
  marketHourlySnapshot.save();

  // update financials
  financialSnapshot.dailySupplySideRevenueUSD =
    financialSnapshot.dailySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  financialSnapshot.dailyProtocolSideRevenueUSD =
    financialSnapshot.dailyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  financialSnapshot.dailyTotalRevenueUSD = financialSnapshot.dailyTotalRevenueUSD.plus(deltaTotalRevenue);
  financialSnapshot.save();
}

// updates the FinancialDailySnapshot Entity
export function snapshotFinancials(
  block: ethereum.Block,
  amountUSD: BigDecimal,
  eventType: string | null = null,
  protocol: LendingProtocol | null = null,
): void {
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
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  }

  // update the block number and timestamp
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  if (eventType != null) {
    // add to daily amounts
    if (eventType == TransactionType.DEPOSIT) {
      financialMetrics.dailyDepositUSD = financialMetrics.dailyDepositUSD.plus(amountUSD);
    } else if (eventType == TransactionType.BORROW) {
      financialMetrics.dailyBorrowUSD = financialMetrics.dailyBorrowUSD.plus(amountUSD);
    } else if (eventType == TransactionType.REPAY) {
      financialMetrics.dailyRepayUSD = financialMetrics.dailyRepayUSD.plus(amountUSD);
    } else if (eventType == TransactionType.WITHDRAW) {
      financialMetrics.dailyWithdrawUSD = financialMetrics.dailyWithdrawUSD.plus(amountUSD);
    } else if (eventType == TransactionType.LIQUIDATE) {
      financialMetrics.dailyLiquidateUSD = financialMetrics.dailyLiquidateUSD.plus(amountUSD);
    }
  }

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, transaction: string): void {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const dailyMetrics = getOrCreateUsageDailySnapshot(event);
  const hourlyMetrics = getOrCreateUsageHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = event.block.number;
  dailyMetrics.timestamp = event.block.timestamp;
  dailyMetrics.dailyTransactionCount += 1;

  // update hourlyMetrics
  hourlyMetrics.blockNumber = event.block.number;
  hourlyMetrics.timestamp = event.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += 1;

  const accountId = from.toHexString();
  let account = Account.load(accountId);
  const protocol = getOrCreateLendingProtocol();
  dailyMetrics.totalPoolCount = protocol.totalPoolCount;
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = ActivityType.DAILY + "-" + from.toHexString() + "-" + id.toString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    dailyMetrics.dailyActiveUsers += 1;
  }

  // create active account for hourlyMetrics
  const hourlyActiveAccountId = ActivityType.HOURLY + "-" + from.toHexString() + "-" + hour.toString();
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    hourlyMetrics.hourlyActiveUsers += 1;
  }

  // update transaction for daily/hourly metrics
  updateTransactionCount(dailyMetrics, hourlyMetrics, transaction);

  hourlyMetrics.save();
  dailyMetrics.save();
}

// update MarketDailySnapshot & MarketHourlySnapshot
export function snapshotMarket(
  block: ethereum.Block,
  marketId: string,
  amountUSD: BigDecimal,
  eventType: string | null = null,
): void {
  const marketDailyMetrics = getOrCreateMarketDailySnapshot(block, marketId);
  const marketHourlyMetrics = getOrCreateMarketHourlySnapshot(block, marketId);

  const market = getOrCreateMarket(marketId);
  marketDailyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailyMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketDailyMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketDailyMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
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
  marketDailyMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketDailyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketHourlyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlyMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketHourlyMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketHourlyMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
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
  marketHourlyMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketHourlyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  // update to latest block/timestamp
  marketDailyMetrics.blockNumber = block.number;
  marketDailyMetrics.timestamp = block.timestamp;
  marketHourlyMetrics.blockNumber = block.number;
  marketHourlyMetrics.timestamp = block.timestamp;

  // add to daily amounts
  if (eventType != null) {
    if (eventType == TransactionType.DEPOSIT) {
      marketDailyMetrics.dailyDepositUSD = marketDailyMetrics.dailyDepositUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyDepositUSD = marketHourlyMetrics.hourlyDepositUSD.plus(amountUSD);
    } else if (eventType == TransactionType.BORROW) {
      marketDailyMetrics.dailyBorrowUSD = marketDailyMetrics.dailyBorrowUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyBorrowUSD = marketHourlyMetrics.hourlyBorrowUSD.plus(amountUSD);
    } else if (eventType == TransactionType.REPAY) {
      marketDailyMetrics.dailyRepayUSD = marketDailyMetrics.dailyRepayUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyRepayUSD = marketHourlyMetrics.hourlyRepayUSD.plus(amountUSD);
    } else if (eventType == TransactionType.WITHDRAW) {
      marketDailyMetrics.dailyWithdrawUSD = marketDailyMetrics.dailyWithdrawUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyWithdrawUSD = marketHourlyMetrics.hourlyWithdrawUSD.plus(amountUSD);
    } else if (eventType == TransactionType.LIQUIDATE) {
      marketDailyMetrics.dailyLiquidateUSD = marketDailyMetrics.dailyLiquidateUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyLiquidateUSD = marketHourlyMetrics.hourlyLiquidateUSD.plus(amountUSD);
    }
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
  transaction: string,
): void {
  if (transaction == TransactionType.DEPOSIT) {
    hourlyUsage.hourlyDepositCount += 1;
    dailyUsage.dailyDepositCount += 1;
  } else if (transaction == TransactionType.WITHDRAW) {
    hourlyUsage.hourlyWithdrawCount += 1;
    dailyUsage.dailyWithdrawCount += 1;
  } else if (transaction == TransactionType.BORROW) {
    hourlyUsage.hourlyBorrowCount += 1;
    dailyUsage.dailyBorrowCount += 1;
  } else if (transaction == TransactionType.REPAY) {
    hourlyUsage.hourlyRepayCount += 1;
    dailyUsage.dailyRepayCount += 1;
  } else if (transaction == TransactionType.LIQUIDATE) {
    hourlyUsage.hourlyLiquidateCount += 1;
    dailyUsage.dailyLiquidateCount += 1;
  }

  hourlyUsage.save();
  dailyUsage.save();
}

export function rollbackRevenue(marketId: string, event: Liquidation, assetStatus: _AssetStatus): void {
  // Roll back supply side & total revenue accounted from liquidation
  // The handleAssetStatus works as if all reserveBalance increases are
  // from interest and calculates total revenue & supply side revenue
  // from reserve increases. But euler collect fees from liquidations too.
  // These fees should be excluded in calculating total & supply side
  // revenue. Here we roll back total and supply side revenue that have already
  // been added because logAssetStatus is emitted before Liquidation in
  // executeLiquidation().
  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(marketId);
  const token = getOrCreateToken(event.params.underlying);
  const repay = bigIntToBDUseDecimals(event.params.repay, DEFAULT_DECIMALS);
  // Line 156 Liquidation.sol: repay * (1 + 0.02)
  const desiredRepay = repay.times(BIGDECIMAL_ONE.plus(UNDERLYING_RESERVES_FEE.div(DECIMAL_PRECISION)));
  const repayExtraUSD = desiredRepay.minus(repay).times(token.lastPriceUSD!);
  const deltaTotalRevenueUSD = repayExtraUSD.times(RESERVE_FEE_SCALE).div(assetStatus.reserveFee.toBigDecimal());
  const deltaSupplySideRevenueUSD = deltaTotalRevenueUSD.minus(repayExtraUSD);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(deltaTotalRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
  protocol.save();

  const financialsSnapshot = getOrCreateFinancials(event.block.timestamp, event.block.number);
  financialsSnapshot.cumulativeTotalRevenueUSD =
    financialsSnapshot.cumulativeTotalRevenueUSD.minus(deltaTotalRevenueUSD);
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    financialsSnapshot.cumulativeSupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
  if (financialsSnapshot.dailyTotalRevenueUSD.ge(deltaTotalRevenueUSD)) {
    financialsSnapshot.dailyTotalRevenueUSD = financialsSnapshot.dailyTotalRevenueUSD.minus(deltaTotalRevenueUSD);
    financialsSnapshot.dailySupplySideRevenueUSD =
      financialsSnapshot.dailySupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
    financialsSnapshot.save();
  }
  financialsSnapshot.save();

  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.minus(deltaTotalRevenueUSD);
  market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event.block, marketId);
  marketDailySnapshot.cumulativeTotalRevenueUSD =
    marketDailySnapshot.cumulativeTotalRevenueUSD.minus(deltaTotalRevenueUSD);
  marketDailySnapshot.cumulativeSupplySideRevenueUSD =
    marketDailySnapshot.cumulativeSupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
  if (marketDailySnapshot.dailyTotalRevenueUSD.ge(deltaTotalRevenueUSD)) {
    marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.minus(deltaTotalRevenueUSD);
    marketDailySnapshot.dailySupplySideRevenueUSD =
      marketDailySnapshot.dailySupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
    marketDailySnapshot.save();
  } else {
    log.error("[rollbackRevenue]market={}/{},blk={},tx={},deltaTotalRevUSD={}>market.dailyTotalRevnueUSD={}", [
      market.name!,
      market.id,
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
      deltaTotalRevenueUSD.toString(),
      marketDailySnapshot.dailyTotalRevenueUSD.toString(),
    ]);
  }

  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event.block, marketId);
  marketHourlySnapshot.cumulativeTotalRevenueUSD =
    marketHourlySnapshot.cumulativeTotalRevenueUSD.minus(deltaTotalRevenueUSD);
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD =
    marketHourlySnapshot.cumulativeSupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
  if (marketHourlySnapshot.hourlyTotalRevenueUSD.ge(deltaTotalRevenueUSD)) {
    marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.minus(deltaTotalRevenueUSD);
    marketHourlySnapshot.hourlySupplySideRevenueUSD =
      marketHourlySnapshot.hourlySupplySideRevenueUSD.minus(deltaSupplySideRevenueUSD);
    marketHourlySnapshot.save();
  } else {
    log.error("[rollbackRevenue]market={}/{},blk={},tx={},deltaTotalRevUSD={}>market.hourlyTotalRevnueUSD={}", [
      market.name!,
      market.id,
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
      deltaTotalRevenueUSD.toString(),
      marketHourlySnapshot.hourlyTotalRevenueUSD.toString(),
    ]);
  }
}
