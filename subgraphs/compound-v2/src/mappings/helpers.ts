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
import {
  Market,
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
  RewardToken,
} from "../../generated/schema";
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
export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  mintTokens: BigInt,
  sender: Address,
): bool {
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
  updateProtocolTVL(event); // also updates market TVL/inputTokenBalance/totalDepositUSD
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
  market.outputTokenSupply = market.outputTokenSupply.minus(cTokenAmount);

  // update market and financial hourly/daily liquidate metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyWithdrawUSD = financialMetrics.dailyWithdrawUSD.plus(withdraw.amountUSD);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyWithdrawUSD = hourlyMetrics.hourlyWithdrawUSD.plus(withdraw.amountUSD);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyWithdrawUSD = dailyMetrics.dailyWithdrawUSD.plus(withdraw.amountUSD);
  dailyMetrics.save();

  withdraw.save();
  market.save();
  updateProtocolTVL(event); // also updates market TVL/inputTokenBalance/totalDepositUSD
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
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD);
  let protocol = getOrCreateLendingProtcol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD);

  // update hourly/daily financial and market metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyBorrowUSD = financialMetrics.dailyBorrowUSD.plus(borrow.amountUSD);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyBorrowUSD = hourlyMetrics.hourlyBorrowUSD.plus(borrow.amountUSD);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyBorrowUSD = dailyMetrics.dailyBorrowUSD.plus(borrow.amountUSD);
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

  // update market and financial hourly/daily repay metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyRepayUSD = financialMetrics.dailyRepayUSD.plus(repay.amountUSD);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyRepayUSD = hourlyMetrics.hourlyRepayUSD.plus(repay.amountUSD);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyRepayUSD = dailyMetrics.dailyRepayUSD.plus(repay.amountUSD);
  dailyMetrics.save();

  market.save();
  repay.save();
  return true;
}

// create liquidate entity, return false if any markets are null
export function createLiquidate(
  event: ethereum.Event,
  liquidatedToken: Address,
  liquidator: Address,
  borrower: Address,
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
  liquidate.liquidatee = borrower.toHexString();
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
  liquidate.profitUSD = liquidate.amountUSD.minus(costUSD);

  // update cumulative liquidates
  liquidatedMarket.cumulativeLiquidateUSD = liquidatedMarket.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD,
  );
  let protocol = getOrCreateLendingProtcol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
  protocol.save();

  // update market and financial hourly/daily liquidate metrics
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.dailyLiquidateUSD = financialMetrics.dailyLiquidateUSD.plus(liquidate.amountUSD);
  financialMetrics.save();
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyLiquidateUSD = hourlyMetrics.hourlyLiquidateUSD.plus(liquidate.amountUSD);
  hourlyMetrics.save();
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyLiquidateUSD = dailyMetrics.dailyLiquidateUSD.plus(liquidate.amountUSD);
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
  let newSupplySideRevenueUSD = newTotalRevenueUSD.times(
    BIGDECIMAL_ONE.minus(market._reserveFactor),
  );
  let newProtocolSideRevenueUSD = newTotalRevenueUSD.times(market._reserveFactor);

  // update protocol revenues
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  protocol.save();

  // update daily financial revenues
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  financialMetrics.save();

  // update market revenues
  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  market.save();

  // update hourly market revenues
  let hourlyMetrics = getOrCreateMarketHourlySnapshot(event);
  hourlyMetrics.hourlyTotalRevenueUSD =
    hourlyMetrics.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
  hourlyMetrics.hourlySupplySideRevenueUSD =
    hourlyMetrics.hourlySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  hourlyMetrics.hourlyProtocolSideRevenueUSD =
    hourlyMetrics.hourlyProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  hourlyMetrics.save();

  // update daily market revenues
  let dailyMetrics = getOrCreateMarketDailySnapshot(event);
  dailyMetrics.dailyTotalRevenueUSD = dailyMetrics.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  dailyMetrics.dailySupplySideRevenueUSD =
    dailyMetrics.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  dailyMetrics.dailyProtocolSideRevenueUSD =
    dailyMetrics.dailyProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  dailyMetrics.save();
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
  market.outputTokenPriceUSD = market.exchangeRate!.times(market.inputTokenPriceUSD);

  market.save();
}

// also updates market.inputTokenBalance
// TVL is equivalent to totalDepositUSD
export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  // loop through each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    let underlyingToken = getOrCreateToken(market.inputToken);

    // mantissaFactor = (inputTokenDecimals - outputTokenDecimals)  (Note: can be negative)
    // inputTokenBalance = (outputSupply * exchangeRate) * (10 ^ mantissaFactor)
    if (underlyingToken.decimals > COMPOUND_DECIMALS) {
      // we want to multiply out the difference to expand BD
      let mantissaFactorBD = exponentToBigDecimal(underlyingToken.decimals - COMPOUND_DECIMALS);
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .times(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(inputTokenBalanceBD.toString());
    } else {
      // we want to divide back the difference to decrease the BD
      let mantissaFactorBD = exponentToBigDecimal(COMPOUND_DECIMALS - underlyingToken.decimals);
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .div(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(inputTokenBalanceBD.toString());
    }

    // calculate inputTokenBalance in USD
    market.inputTokenPriceUSD = getUSDPriceOfToken(market, event.block.number.toI32());
    let supplyUSD = market.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
      .times(market.inputTokenPriceUSD);
    market.totalValueLockedUSD = supplyUSD;
    market.totalDepositBalanceUSD = supplyUSD;
    totalValueLockedUSD = totalValueLockedUSD.plus(supplyUSD);
    market.save();
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.totalDepositBalanceUSD = totalValueLockedUSD;
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
    let blocksPerDay = BigInt.fromString(
      getOrCreateCircularBuffer().blocksPerDay.truncate(0).toString(),
    );

    let compPriceUSD = BIGDECIMAL_ZERO;
    let supplyCompPerDay = BIGINT_ZERO;
    let borrowCompPerDay = BIGINT_ZERO;
    // get comp speeds (changed storage after block 13322798)
    // See proposal 62: https://compound.finance/governance/proposals/62
    if (event.block.number.toI32() > 13322798) {
      // comp speeds can be different for supply/borrow side
      let tryBorrowSpeed = troller.try_compBorrowSpeeds(event.address);
      let trySupplySpeed = troller.try_compSupplySpeeds(event.address);
      borrowCompPerDay = tryBorrowSpeed.reverted
        ? BIGINT_ZERO
        : tryBorrowSpeed.value.times(blocksPerDay);
      supplyCompPerDay = trySupplySpeed.reverted
        ? BIGINT_ZERO
        : trySupplySpeed.value.times(blocksPerDay);
    } else {
      // comp speeds are the same for supply/borrow side
      let tryCompSpeed = troller.try_compSpeeds(event.address);
      supplyCompPerDay = tryCompSpeed.reverted
        ? BIGINT_ZERO
        : tryCompSpeed.value.times(blocksPerDay);
      borrowCompPerDay = supplyCompPerDay;
    }

    // get COMP price
    // cCOMP was made at this block height 10960099
    if (event.block.number.toI32() > 10960099) {
      let compMarket = getOrCreateMarket(event, Address.fromString(CCOMP_ADDRESS));
      compPriceUSD = compMarket.inputTokenPriceUSD;

      // backup pricing
      if (compPriceUSD == BIGDECIMAL_ZERO) {
        compPriceUSD = getUsdPricePerToken(
          Address.fromString(COMP_ADDRESS),
          event.block.number.toI32(),
        ).usdPrice.div(exponentToBigDecimal(USDC_DECIMALS));
      }
    } else {
      // try to get COMP price between blocks 10271924 - 10960099 using price oracle library
      compPriceUSD = getUsdPricePerToken(
        Address.fromString(COMP_ADDRESS),
        event.block.number.toI32(),
      ).usdPrice.div(exponentToBigDecimal(USDC_DECIMALS));
    }

    let borrowCompPerDayUSD = borrowCompPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(compPriceUSD);
    let supplyCompPerDayUSD = supplyCompPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(compPriceUSD);
    market.rewardTokenEmissionsAmount = [borrowCompPerDay, supplyCompPerDay]; // same order as market.rewardTokens
    market.rewardTokenEmissionsUSD = [borrowCompPerDayUSD, supplyCompPerDayUSD];
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

  let blockRateCalc = blockRate
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(blocksPerDay)
    .plus(BIGDECIMAL_ONE);

  return powBigDecimal(blockRateCalc, DAYS_PER_YEAR)
    .minus(BIGDECIMAL_ONE)
    .times(BIGDECIMAL_ONEHUNDRED);
}
