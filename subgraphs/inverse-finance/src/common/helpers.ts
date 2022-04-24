import {
  INT_ZERO,
  INT_ONE,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  FACTORY_ADDRESS,
  XINV_ADDRESS,
  SECONDS_PER_DAY,
  MANTISSA_DECIMALS,
} from "./constants";
import { CErc20, Mint, Redeem, Borrow, RepayBorrow, LiquidateBorrow } from "../../generated/templates/CToken/CErc20";
import { JumpRateModelV2 } from "../../generated/templates/CToken/JumpRateModelV2";
import {
  Account,
  DailyActiveAccount,
  Market,
  Deposit,
  Withdraw,
  Borrow as BorrowSC,
  Repay,
  Liquidate,
  UsageMetricsDailySnapshot,
  MarketDailySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import { Factory } from "../../generated/Factory/Factory";
import { log, ethereum, BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { getUnderlyingTokenPricePerAmount } from "./getters";
import {
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateUnderlyingToken,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateMarket,
  getUnderlyingTokenPrice,
} from "./getters";
import { decimalsToBigDecimal } from "./utils";
import { BLOCKS_PER_YEAR } from "./constants";

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

// Create DailyActiveAccount entity for participating account
// return 1 if account is new on the day, 0 if account already exists
export function createAndIncrementDailyAccount(dailyActiveAccountId: string): i32 {
  // id: string = `{Number of days since Unix epoch}-{address}`
  let account = DailyActiveAccount.load(dailyActiveAccountId);
  if (account == null) {
    account = new DailyActiveAccount(dailyActiveAccountId);
    account.save();
    return INT_ONE;
  }

  return INT_ZERO;
}

export function createDeposit(event: Mint): void {
  let depositId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let deposit = Deposit.load(depositId);

  if (deposit == null) {
    let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
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
    deposit.amount = event.params.mintAmount;
    deposit.amountUSD = deposit.amount.toBigDecimal().times(pricePerToken);
    deposit.save();
  } else {
    log.warning("Deposit {} already exists", [depositId]);
  }
}

export function createWithdraw(event: Redeem): void {
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
}

export function createBorrow(event: Borrow): void {
  let borrowId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let borrow = BorrowSC.load(borrowId);

  if (borrow == null) {
    let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
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
    borrow.amount = event.params.borrowAmount;
    borrow.amountUSD = borrow.amount.toBigDecimal().times(pricePerToken);

    borrow.save();
  } else {
    log.warning("Borrow {} already exists", [borrowId]);
  }
}

export function createRepay(event: RepayBorrow): void {
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
}

export function createLiquidate(event: LiquidateBorrow): void {
  let liquidateId = event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.toString();
  let liquidate = Liquidate.load(liquidateId);

  if (liquidate == null) {
    let pricePerUnderlyingToken = getUnderlyingTokenPricePerAmount(event.address);
    let pricePerCollateralToken = getUnderlyingTokenPricePerAmount(event.params.cTokenCollateral);

    liquidate = new Liquidate(liquidateId);

    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.logIndex = event.transactionLogIndex.toI32();
    liquidate.protocol = FACTORY_ADDRESS;
    liquidate.to = event.address.toHexString();
    liquidate.from = event.params.liquidator.toHexString(); //dataSource.address().toHexString()
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;
    liquidate.market = event.address.toHexString();
    liquidate.asset = event.params.cTokenCollateral.toHexString();
    liquidate.amount = event.params.seizeTokens;
    liquidate.amountUSD = liquidate.amount.toBigDecimal().times(pricePerCollateralToken);
    let repayAmountUSD = event.params.repayAmount.toBigDecimal().times(pricePerUnderlyingToken);

    liquidate.profitUSD = liquidate.amountUSD!.minus(repayAmountUSD);

    liquidate.save();
  } else {
    log.warning("Liquidate {} already exists", [liquidateId]);
  }
}

// Update UsageMetricsDailySnapshots entity and LendingProtocol.totalUniqueUsers
export function updateUsageMetrics(event: ethereum.Event, user: Address): void {
  // Number of days since Unix epoch
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let daysStr: string = days.toString();
  let daysPrior = days - 1;
  let daysPriorStr: string = daysPrior.toString();
  let accountId: string = user.toHexString();
  let dailyActiveAccountId: string = daysStr + "-" + accountId;

  //let protocol = getOrCreateProtocol()
  // Account entity keeps user addresses
  let isNewUniqueUser = createAndIncrementAccount(accountId);
  let isNewDailyActiveUser = createAndIncrementDailyAccount(dailyActiveAccountId);

  let usageMetrics = UsageMetricsDailySnapshot.load(daysStr);
  let usageMetricsPrior = UsageMetricsDailySnapshot.load(daysPriorStr);
  let totalUniqueUsersPriorDay = usageMetricsPrior == null ? 0 : usageMetricsPrior.totalUniqueUsers;
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(daysStr);
    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = totalUniqueUsersPriorDay;
    usageMetrics.dailyTransactionCount = 0;
  }

  usageMetrics.activeUsers += isNewDailyActiveUser;
  usageMetrics.totalUniqueUsers += isNewUniqueUser;
  usageMetrics.dailyTransactionCount += 1; //increment whenever updateUsageMetrics is called

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;

  usageMetrics.save();

  // update LendingProtocol.totalUniqueUsers
  let protocol = getOrCreateProtocol();
  if (protocol == null) {
    log.error("LendingProtocol entity is null{}; something went wrong", [""]);
    return;
  }

  protocol.totalUniqueUsers += isNewUniqueUser;
  protocol.save();
}

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let marketAddrs = factoryContract.getAllMarkets();
  // sum over AllMarkets
  for (let i = 0; i < marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString();
    let market = Market.load(marketId);

    if (market != null) {
      financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO;
      financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(market.totalVolumeUSD);
      financialMetrics.totalDepositUSD = financialMetrics.totalDepositUSD.plus(market.totalDepositUSD);
      financialMetrics.totalBorrowUSD = financialMetrics.totalBorrowUSD.plus(market.totalBorrowUSD);

    }
  }
  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

export function updateFinancialsRevenue(
  event: ethereum.Event,
  newProtocolRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(newTotalRevenueUSD);

  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(newProtocolRevenueUSD);

  financialMetrics.supplySideRevenueUSD = newTotalRevenueUSD.minus(newProtocolRevenueUSD);

  financialMetrics.save();
}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(event: ethereum.Event): void {
  let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let marketId = event.address.toHexString();

  let market = getOrCreateMarket(marketId, event);
  let marketMetrics = MarketDailySnapshot.load(days);
  if (marketMetrics == null) {
    marketMetrics = new MarketDailySnapshot(days);
    marketMetrics.protocol = FACTORY_ADDRESS;
    marketMetrics.market = marketId;
  }
  // use market entity to update MarketMetrics
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.totalVolumeUSD = market.totalVolumeUSD;
  marketMetrics.totalDepositUSD = market.totalDepositUSD;
  marketMetrics.totalBorrowUSD = market.totalBorrowUSD;
  marketMetrics.inputTokenBalances = market.inputTokenBalances;
  marketMetrics.inputTokenPricesUSD = market.inputTokenPricesUSD;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketMetrics.depositRate = market.depositRate;
  //inverse finance does not have stable borrow rate
  //marketMetrics.stableBorrowRate = market.stableBorrowRate
  marketMetrics.variableBorrowRate = market.variableBorrowRate;

  // Update the block number and timestamp to that of the last transaction of that day
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  marketMetrics.save();
}

// Update Market entity
export function updateMarket(event: ethereum.Event, borrowAmount: BigInt = BIGINT_ZERO): void {
  // event must be emitted by the CToken/Market contract
  let marketId = event.address.toHexString();
  // alternatively, get marketId from dataSource.address
  let markets = Factory.bind(Address.fromString(FACTORY_ADDRESS)).getAllMarkets();
  assert(markets.includes(event.address), "Event not emitted by a CToken contract");

  let market = getOrCreateMarket(marketId, event);
  if (market != null) {
    let tokenContract = CErc20.bind(event.address);
    let pricePerUnderlyingToken = getUnderlyingTokenPricePerAmount(event.address);
    // To get the price of the underlying (input) token
    let inputTokenPrice = getUnderlyingTokenPrice(event.address);
    let pricePerInputToken = getUnderlyingTokenPricePerAmount(event.address);
    let inputTokenBalance = tokenContract.getCash();
    market.inputTokenBalances = [inputTokenBalance];
    market.inputTokenPricesUSD = [inputTokenPrice];
    market.totalDepositUSD = inputTokenBalance.toBigDecimal().times(pricePerInputToken);

    market.totalValueLockedUSD = market.totalDepositUSD;
    market.outputTokenSupply = tokenContract.totalSupply();
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO; // Not tradeable & has no price
    let totalBorrows = tokenContract.try_totalBorrows();
    if (totalBorrows.reverted) {
      log.warning("Failed to get totalBorrows for market {} at tx hash {}; Not updating Market.totalBorrowUSD", [
        marketId,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      market.totalBorrowUSD = totalBorrows.value.toBigDecimal().times(pricePerUnderlyingToken);
    }
    if (borrowAmount != BIGINT_ZERO) {
      let borrowAmountUSD = borrowAmount.toBigDecimal().times(pricePerUnderlyingToken);

      market.totalVolumeUSD = market.totalVolumeUSD.plus(borrowAmountUSD);
    }
    //
    //These two are updated in updateMarketEmission
    // triggered by comptroller.DistributedBorrowerComp and
    // DistributedSupplierComp
    //market.rewardTokenEmissionsAmount
    //market.rewardTokenEmissionsUSD
    //These three are updated in updateMarketRates
    //market.depositRate
    //market.variableBorrowRate

    market.save();
  } else {
    log.warning("Market {} does not exist", [marketId]);
  }
}

// Update LendindProtocol entity info
export function updateProtocol(event: ethereum.Event): void {
  let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();

  let protocol = getOrCreateProtocol();
  if (protocol == null) {
    log.error("LendingProtocol entity is empty {}; something went wrong", [""]);
    return;
  }

  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let marketAddrs = factoryContract.getAllMarkets();

  // sum over AllMarkets
  let totalVolumeUSD = BIGDECIMAL_ZERO;
  let totalDepositUSD = BIGDECIMAL_ZERO;
  let totalBorrowUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString();
    let market = Market.load(marketId);

    if (market != null) {
      totalVolumeUSD = totalVolumeUSD.plus(market.totalVolumeUSD);
      totalDepositUSD = totalDepositUSD.plus(market.totalDepositUSD);
      totalBorrowUSD = totalBorrowUSD.plus(market.totalBorrowUSD);
    }
  }
  protocol.totalVolumeUSD = totalVolumeUSD;
  protocol.totalDepositUSD = totalDepositUSD;
  protocol.totalBorrowUSD = totalBorrowUSD;

  protocol.save();
}

export function updateMarketEmission(marketId: string, newEmissionAmount: BigInt, event: ethereum.Event): void {
  let market = getOrCreateMarket(marketId, event);
  if (market == null) {
    log.error("Market {} does not exist.", [marketId]);
    return;
  }

  let pricePerToken = getUnderlyingTokenPricePerAmount(Address.fromString(XINV_ADDRESS));
  // We use mark-to-market accounting here
  let emissionAmount = market.rewardTokenEmissionsAmount![0].plus(newEmissionAmount);
  let emissionUSD = emissionAmount.toBigDecimal().times(pricePerToken);
  market.rewardTokenEmissionsAmount = [emissionAmount];
  market.rewardTokenEmissionsUSD = [emissionUSD];

  market.save();
}

export function updateMarketRates(event: ethereum.Event): void {
  let marketId = event.address.toHexString();
  log.info("Updating rates for Market {} at tx hash {} ...", [marketId, event.transaction.hash.toHexString()]);

  let market = getOrCreateMarket(marketId, event);
  if (market == null) {
    log.error("Market {} does not exist.", [marketId]);
    return;
  }

  let tokenContract = CErc20.bind(event.address);
  let borrowRate = tokenContract.try_borrowRatePerBlock();
  let depositRate = tokenContract.try_supplyRatePerBlock();
  if (borrowRate.reverted) {
    log.warning("Failed to get borrowRatePerBlock() for Market {} at tx hash {}", [
      marketId,
      event.transaction.hash.toHexString(),
    ]);
  } else {
    market.variableBorrowRate = borrowRate.value
      .toBigDecimal()
      .times(BLOCKS_PER_YEAR)
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS));
  }
  if (depositRate.reverted) {
    log.warning("Failed to get supplyRatePerBlock() for Market {} at tx hash {}", [
      marketId,
      event.transaction.hash.toHexString(),
    ]);
  } else {
    market.depositRate = depositRate.value
      .toBigDecimal()
      .times(BLOCKS_PER_YEAR)
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS));
  }

  market.save();
}
