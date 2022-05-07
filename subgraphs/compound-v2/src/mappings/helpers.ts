// helper functions for ./mappings.ts
import {
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  COMPOUND_DECIMALS,
  DEFAULT_DECIMALS,
  RewardTokenType,
  CCOMP_ADDRESS,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  DAYS_PER_YEAR,
  USDC_DECIMALS,
  BIGINT_ZERO,
  BIGDECIMAL_ONEHUNDRED,
  InterestRateSide,
  InterestRateType,
} from "../common/utils/constants";
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateRate,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { Market, Deposit, Withdraw, Borrow, Repay, Liquidate, RewardToken } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { CTokenNew } from "../../generated/Comptroller/CTokenNew";
import { Comptroller } from "../../generated/Comptroller/Comptroller";
import { getUSDPriceOfToken } from "../common/prices";
import { exponentToBigDecimal, getExchangeRate, powBigDecimal } from "../common/utils/utils";
import { getOrCreateCircularBuffer } from "../common/rewards";
import { getUsdPricePerToken } from "../common/prices/index";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

// create a Deposit entity, return false if transaction is null
// null = market does not exist
export function createDeposit(event: ethereum.Event, amount: BigInt, mintTokens: BigInt, sender: Address): bool {
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);
  let protocol = getOrCreateLendingProtcol();

  // grab local vars
  let blockNumber = event.block.number;
  let transactionHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex;
  let id = transactionHash + "-" + logIndex.toString();

  // create new Deposit
  let deposit = new Deposit(id);

  // fill in deposit vars
  deposit.hash = transactionHash;
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = COMPTROLLER_ADDRESS;
  deposit.to = marketAddress.toHexString();
  deposit.from = sender.toHexString();
  deposit.blockNumber = blockNumber;
  deposit.timestamp = event.block.timestamp;
  deposit.market = marketAddress.toHexString();
  deposit.asset = market.inputToken;
  deposit.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._lastUpdateBlock < event.block.number) {
    updateMarketPrices(market, event);
    updateMarketRates(market);
    updateRewards(event, market);
    market._lastUpdateBlock = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  deposit.amountUSD = market.inputTokenPriceUSD.times(decimalAmount);

  // update cToken supply
  market.outputTokenSupply = market.outputTokenSupply.plus(mintTokens);

  // update inputTokensBalance
  market.inputTokenBalance = market.inputTokenBalance.plus(amount);

  // update protocol totalDepositUSD
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deposit.amountUSD);
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deposit.amountUSD);

  // update financialMetrics/marketMetrics daily/hourly deposit
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyDepositUSD = financialMetrics.dailyDepositUSD.plus(deposit.amountUSD);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyDepositUSD = hourlyMetrics.hourlyDepositUSD.plus(deposit.amountUSD);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyDepositUSD = dailyMetrics.dailyDepositUSD.plus(deposit.amountUSD);
  dailyMetrics.save();

  protocol.save();
  market.save();
  deposit.save();
  updateTotalDepositUSD(event);
  updateProtocolTVL(event); // also updates market TVL
  return true;
}

// creates a withdraw entity, returns false if market does not exist
export function createWithdraw(
  event: ethereum.Event,
  redeemer: Address,
  underlyingAmount: BigInt,
  cTokenAmount: BigInt,
): bool {
  // grab and store market entity
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);

  // local vars
  let blockNumber = event.block.number;
  let transactionHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex;
  let id = transactionHash + "-" + logIndex.toString();

  // creates Withdraw entity
  let withdraw = new Withdraw(id);

  // fill in withdraw vars
  withdraw.hash = transactionHash;
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = COMPTROLLER_ADDRESS;
  withdraw.to = redeemer.toHexString();
  withdraw.from = marketAddress.toHexString();
  withdraw.blockNumber = blockNumber;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = marketAddress.toHexString();
  withdraw.asset = market.inputToken;
  withdraw.amount = underlyingAmount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._lastUpdateBlock < event.block.number) {
    updateMarketPrices(market, event);
    updateMarketRates(market);
    updateRewards(event, market);
    market._lastUpdateBlock = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let decimalAmount = underlyingAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  withdraw.amountUSD = market.inputTokenPriceUSD.times(decimalAmount);

  // update token supplies
  market.inputTokenBalance = market.inputTokenBalance.minus(underlyingAmount);
  market.outputTokenSupply = market.outputTokenSupply.minus(cTokenAmount);

  withdraw.save();
  market.save();
  updateTotalDepositUSD(event);
  updateProtocolTVL(event); // also updates market TVL
  return true;
}

export function createBorrow(event: ethereum.Event, borrower: Address, amount: BigInt): bool {
  // grab and store market entity
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);
  if (!market.canBorrowFrom) {
    market.canBorrowFrom = true;
    market.save();
  }

  // local vars
  let blockNumber = event.block.number;
  let transactionHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex;
  let id = transactionHash + "-" + logIndex.toString();

  // creates Borrow entity
  let borrow = new Borrow(id);

  // fill in borrow vars
  borrow.hash = transactionHash;
  borrow.logIndex = logIndex.toI32();
  borrow.protocol = COMPTROLLER_ADDRESS;
  borrow.to = borrower.toHexString();
  borrow.from = marketAddress.toHexString();
  borrow.blockNumber = blockNumber;
  borrow.timestamp = event.block.timestamp;
  borrow.market = marketAddress.toHexString();
  borrow.asset = market.inputToken;
  borrow.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._lastUpdateBlock < event.block.number) {
    updateMarketPrices(market, event);
    updateMarketRates(market);
    updateRewards(event, market);
    market._lastUpdateBlock = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  borrow.amountUSD = market.inputTokenPriceUSD.times(decimalAmount);

  // update cumulative borrows
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD!);
  let protocol = getOrCreateLendingProtcol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD!);

  // update hourly/daily financial and market metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyBorrowUSD = financialMetrics.dailyBorrowUSD.plus(borrow.amountUSD!);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyBorrowUSD = hourlyMetrics.hourlyBorrowUSD.plus(borrow.amountUSD!);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyBorrowUSD = dailyMetrics.dailyBorrowUSD.plus(borrow.amountUSD!);
  dailyMetrics.save();

  borrow.save();
  market.save();
  protocol.save();
  return true;
}

// create Repay entity, return false if market does not exist
export function createRepay(event: ethereum.Event, payer: Address, amount: BigInt): bool {
  // grab and store market entity
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);

  // local vars
  let blockNumber = event.block.number;
  let transactionHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex;
  let id = transactionHash + "-" + logIndex.toString();

  // create Repay entity
  let repay = new Repay(id);

  // populate repay vars
  repay.hash = transactionHash;
  repay.logIndex = logIndex.toI32();
  repay.protocol = COMPTROLLER_ADDRESS;
  repay.to = marketAddress.toHexString();
  repay.from = payer.toHexString();
  repay.blockNumber = blockNumber;
  repay.timestamp = event.block.timestamp;
  repay.market = marketAddress.toHexString();
  repay.asset = market.inputToken;
  repay.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._lastUpdateBlock < event.block.number) {
    updateMarketPrices(market, event);
    updateMarketRates(market);
    updateRewards(event, market);
    market._lastUpdateBlock = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  repay.amountUSD = market.inputTokenPriceUSD.times(decimalAmount);

  market.save();
  repay.save();
  return true;
}

// create liquidate entity, return false if any markets are null
export function createLiquidate(
  event: ethereum.Event,
  liquidatedToken: Address,
  liquidator: Address,
  liquidatedAmount: BigInt, // sieze tokens
  repaidAmount: BigInt,
): bool {
  // grab and store market
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);
  if (!market.canUseAsCollateral) {
    market.canUseAsCollateral = true;
    market.save();
  }

  // local vars
  let blockNumber = event.block.number;
  let transactionHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex;
  let id = transactionHash + "-" + logIndex.toString();

  // create liquidate entity
  let liquidate = new Liquidate(id);

  // populate liquidates vars
  liquidate.hash = transactionHash;
  liquidate.logIndex = logIndex.toI32();
  liquidate.protocol = COMPTROLLER_ADDRESS;
  liquidate.to = marketAddress.toHexString();
  liquidate.from = liquidator.toHexString();
  liquidate.blockNumber = blockNumber;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = marketAddress.toHexString();

  // get liquidated underlying address
  let liquidatedMarket = getOrCreateMarket(event, liquidatedToken);
  liquidate.asset = liquidatedToken.toHexString();

  // get/update prices/rates/accrue interest/rewards for market
  if (market._lastUpdateBlock < event.block.number) {
    updateMarketPrices(market, event);
    updateMarketRates(market);
    updateRewards(event, market);
    market._lastUpdateBlock = event.block.number;
  }
  if (liquidatedMarket._lastUpdateBlock < event.block.number) {
    updateMarketPrices(liquidatedMarket, event);
    updateMarketRates(liquidatedMarket);
    updateRewards(event, liquidatedMarket);
    liquidatedMarket._lastUpdateBlock = event.block.number;
  }

  // calc amount/amountUSD/profitUSD
  liquidate.amount = liquidatedAmount;
  liquidate.amountUSD = liquidatedAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(COMPOUND_DECIMALS))
    .times(liquidatedMarket.outputTokenPriceUSD);
  let repayUnderlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let costUSD: BigDecimal = repaidAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(repayUnderlyingDecimals))
    .times(market.inputTokenPriceUSD);
  liquidate.profitUSD = liquidate.amountUSD!.minus(costUSD);

  // update cumulative liquidates
  liquidatedMarket.cumulativeLiquidateUSD = liquidatedMarket.cumulativeLiquidateUSD.plus(liquidate.amountUSD!);
  let protocol = getOrCreateLendingProtcol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidate.amountUSD!);
  protocol.save();

  // update market and financial hourly/daily liquidate metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyLiquidateUSD = financialMetrics.dailyLiquidateUSD.plus(liquidate.amountUSD!);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyLiquidateUSD = hourlyMetrics.hourlyLiquidateUSD.plus(liquidate.amountUSD!);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyLiquidateUSD = dailyMetrics.dailyLiquidateUSD.plus(liquidate.amountUSD!);
  dailyMetrics.save();

  liquidatedMarket.save();
  market.save();
  liquidate.save();
  return true;
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// accrue interests on outstanding borrows from AccrueInterest() event
export function updateRevenue(event: ethereum.Event, newInterest: BigInt): void {
  // get entities to update
  let market = getOrCreateMarket(event, event.address);
  let protocol = getOrCreateLendingProtcol();
  let financialMetrics = getOrCreateFinancials(event);

  // calculate new supply/protocol/total revenue
  let inputTokenDecimals = getOrCreateToken(market.inputToken).decimals;
  let newTotalRevenueUSD = newInterest
    .toBigDecimal()
    .div(exponentToBigDecimal(inputTokenDecimals))
    .times(market.inputTokenPriceUSD);
  let newSupplySideRevenueUSD = newTotalRevenueUSD.times(BIGDECIMAL_ONE.minus(market._reserveFactor));
  let newProtocolSideRevenueUSD = newTotalRevenueUSD.times(market._reserveFactor);

  // update protocol revenues
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  protocol.save();

  // update daily revenues
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  financialMetrics.save();
}

export function updateMarketPrices(market: Market, event: ethereum.Event): void {
  let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let exchangeRate = getExchangeRate(Address.fromString(market.id));

  /*
   * Exchange rate explained:
   * In Practice:
   *    - if you call cDAI on etherscan you get (2.0 * 10^26)
   *    - if you call cUSDC on etherscan you get (2.0 * 10^14)
   *    - the real value is ~0.02 so cDAI is off by 10^28, and cUSDC 10^16
   * How to accomadate this:
   *    - must divide by tokenDecimals, so 10^underlyingDecimals (use exponenttoBigDecimal())
   *    - must multiply by cTokenDecimals, so 10^COMPOUND_DECIMALS
   *    - must divide by mantissaFactorBD, so 10^18
   */
  market.exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market.inputTokenPriceUSD = getUSDPriceOfToken(market, event.block.number.toI32());
  market.outputTokenPriceUSD = market.exchangeRate.times(market.inputTokenPriceUSD);

  market.save();
}

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  // loop through each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    market.inputTokenPriceUSD = getUSDPriceOfToken(market, event.block.number.toI32());
    let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
    market.totalValueLockedUSD = market.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPriceUSD);
    totalValueLockedUSD = totalValueLockedUSD.plus(market.totalValueLockedUSD);
    market.save();
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function updateTotalBorrowUSD(event: ethereum.Event, newTotalBorrow: BigInt): BigDecimal {
  // update totalBorrow for market that emitted event
  let thisMarket = getOrCreateMarket(event, event.address);
  thisMarket._currentBorrowBalance = newTotalBorrow;
  thisMarket.save();

  // grab protocol and calculate total Borrows across all pools
  let protocol = getOrCreateLendingProtcol();
  let totalBorrowUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    market.inputTokenPriceUSD = getUSDPriceOfToken(market, event.block.number.toI32());
    let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
    market.totalBorrowBalanceUSD = market._currentBorrowBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPriceUSD)
      .truncate(DEFAULT_DECIMALS);
    totalBorrowUSD = totalBorrowUSD.plus(market.totalBorrowBalanceUSD);
    market.save();
  }
  protocol.totalBorrowBalanceUSD = totalBorrowUSD;
  protocol.save();

  return totalBorrowUSD;
}

export function updateTotalDepositUSD(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalDepositUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    market.inputTokenPriceUSD = getUSDPriceOfToken(market, event.block.number.toI32());
    let underlyingDecimals = getOrCreateToken(market.inputToken).decimals;
    market.totalDepositBalanceUSD = market.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPriceUSD)
      .truncate(DEFAULT_DECIMALS);
    totalDepositUSD = totalDepositUSD.plus(market.totalDepositBalanceUSD);
    market.save();
  }
  protocol.totalDepositBalanceUSD = totalDepositUSD;
  protocol.save();
}

export function updateRewards(event: ethereum.Event, market: Market): void {
  // COMP was not created until block 10271924: https://etherscan.io/tx/0x03dab5602fb58bb44c1a248fd1b283ca46b539969fe02db144983247d00cfb89
  if (event.block.number.toI32() > 10271924) {
    let rewardTokenBorrow: RewardToken | null = null;
    let rewardTokenDeposit: RewardToken | null = null;
    // check if market has COMP reward tokens
    if (market.rewardTokens == null) {
      rewardTokenDeposit = getOrCreateRewardToken(RewardTokenType.DEPOSIT);
      rewardTokenBorrow = getOrCreateRewardToken(RewardTokenType.BORROW);
      market.rewardTokens = [rewardTokenDeposit.id, rewardTokenBorrow.id];
    }
    // get COMP distribution/block
    if (rewardTokenBorrow == null) {
      rewardTokenBorrow = getOrCreateRewardToken(RewardTokenType.BORROW);
    }
    let rewardDecimals = getOrCreateToken(rewardTokenBorrow.token).decimals;
    let troller = Comptroller.bind(Address.fromString(COMPTROLLER_ADDRESS));
    let blocksPerDay = BigInt.fromString(getOrCreateCircularBuffer().blocksPerDay.truncate(0).toString());
    let tryDistribution = troller.try_compSpeeds(event.address);
    // get comp speed per day - this is the distribution amount for supplying and borrowing
    let compPerDay = tryDistribution.reverted ? BIGINT_ZERO : tryDistribution.value.times(blocksPerDay);
    let compPriceUSD = BIGDECIMAL_ZERO;

    // cCOMP was made at this block height 10960099
    if (event.block.number.toI32() > 10960099) {
      let compMarket = getOrCreateMarket(event, Address.fromString(CCOMP_ADDRESS));
      compPriceUSD = compMarket.inputTokenPriceUSD;
    } else {
      // try to get COMP price between blocks 10271924 - 10960099 using price oracle library
      compPriceUSD = getUsdPricePerToken(Address.fromString(COMP_ADDRESS), event.block.number.toI32()).usdPrice.div(
        exponentToBigDecimal(USDC_DECIMALS),
      );
    }

    // ensure we have a price
    if (compPriceUSD == BIGDECIMAL_ZERO) {
      compPriceUSD = getUsdPricePerToken(Address.fromString(COMP_ADDRESS), event.block.number.toI32()).usdPrice.div(
        exponentToBigDecimal(USDC_DECIMALS),
      );
    }

    let compPerDayUSD = compPerDay.toBigDecimal().div(exponentToBigDecimal(rewardDecimals)).times(compPriceUSD);
    market.rewardTokenEmissionsAmount = [compPerDay, compPerDay];
    market.rewardTokenEmissionsUSD = [compPerDayUSD, compPerDayUSD];
    market.save();
  }
}

export function updateMarketRates(market: Market): void {
  // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
  // So we handle it like this.

  let contract = CTokenNew.bind(Address.fromString(market.id));
  let trySupplyRatePerBlock = contract.try_supplyRatePerBlock();
  let depositRate = getOrCreateRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, market.id);
  depositRate.rate = trySupplyRatePerBlock.reverted
    ? BIGDECIMAL_ZERO
    : convertBlockRateToAPY(trySupplyRatePerBlock.value);
  depositRate.save();

  // update borrow rates
  // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
  let tryBorrowRatePerBlock = contract.try_borrowRatePerBlock();
  let borrowRate = getOrCreateRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, market.id);
  borrowRate.rate = tryBorrowRatePerBlock.reverted
    ? BIGDECIMAL_ZERO
    : convertBlockRateToAPY(tryBorrowRatePerBlock.value);
  borrowRate.save();
}

// APY rate calculation explained here: https://compound.finance/docs#protocol-math
export function convertBlockRateToAPY(blockRate: BigInt): BigDecimal {
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let blocksPerDay = getOrCreateCircularBuffer().blocksPerDay;

  let blockRateCalc = blockRate.toBigDecimal().div(mantissaFactorBD).times(blocksPerDay).plus(BIGDECIMAL_ONE);

  return powBigDecimal(blockRateCalc, DAYS_PER_YEAR).minus(BIGDECIMAL_ONE).times(BIGDECIMAL_ONEHUNDRED);
}
