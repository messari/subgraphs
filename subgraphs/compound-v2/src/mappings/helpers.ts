// helper functions for ./mappings.ts
import {
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  COMPOUND_DECIMALS,
  DEFAULT_DECIMALS,
  BLOCKS_PER_YEAR,
  RewardTokenType,
  CCOMP_ADDRESS,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGDECIMAL_ONE,
} from "../common/utils/constants";
import {
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { Market, Deposit, Withdraw, Borrow, Repay, Liquidation, RewardToken } from "../types/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { CToken } from "../types/Comptroller/cToken";
import { getUSDPriceOfToken } from "../common/prices/prices";
import { exponentToBigDecimal, getExchangeRate } from "../common/utils/utils";
import { Comptroller } from "../types/Comptroller/Comptroller";
import { PriceOracle2 } from "../types/Comptroller/PriceOracle2";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

// create a Deposit entity, return false if transaction is null
// null = market does not exist
export function createDeposit(event: ethereum.Event, amount: BigInt, mintTokens: BigInt, sender: Address): bool {
  let marketAddress = event.address;
  let market = getOrCreateMarket(event, marketAddress);

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
  deposit.asset = market.inputTokens[0];
  deposit.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(market);
    updateMarketPrices(market, event);
    updateMarketRates(market); // also accrues interest on balances
    accrueInterestsOnBalances(market);
    updateRewards(event, market);
    market._currentBlockNumber = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  deposit.amountUSD = market.inputTokenPricesUSD[0].times(decimalAmount);

  // update cToken supply
  market.outputTokenSupply = market.outputTokenSupply.plus(mintTokens);

  // update inputTokensBalance
  let inputBalance = market.inputTokenBalances;
  inputBalance = [inputBalance[0].plus(amount)];
  market.inputTokenBalances = inputBalance;

  // update totalDepositUSD
  market.totalDepositUSD = market.inputTokenBalances[0]
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(market.inputTokenPricesUSD[0]);

  // update protocol totalDepositUSD
  updateTotalDepositUSD(event);

  market.save();
  deposit.save();
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
  withdraw.asset = market.inputTokens[0];
  withdraw.amount = underlyingAmount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(market);
    updateMarketPrices(market, event);
    updateMarketRates(market);
    accrueInterestsOnBalances(market);
    updateRewards(event, market);
    market._currentBlockNumber = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = underlyingAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  withdraw.amountUSD = market.inputTokenPricesUSD[0].times(decimalAmount);

  // update inputTokenBalances
  let inputBalance = market.inputTokenBalances;
  inputBalance = [inputBalance[0].minus(underlyingAmount)];
  market.inputTokenBalances = inputBalance;

  // update totalDepositUSD
  market.totalDepositUSD = market.inputTokenBalances[0]
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(market.inputTokenPricesUSD[0]);

  // update outputTokenSupply
  market.outputTokenSupply = market.outputTokenSupply.minus(cTokenAmount);

  // update protocol totalDepositUSD
  updateTotalDepositUSD(event);

  withdraw.save();
  market.save();
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
  borrow.asset = market.inputTokens[0];
  borrow.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(market);
    updateMarketPrices(market, event);
    updateMarketRates(market);
    accrueInterestsOnBalances(market);
    updateRewards(event, market);
    market._currentBlockNumber = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  market._totalBorrowNative = market._totalBorrowNative.plus(amount); // must be after revenue updates
  market.totalBorrowUSD = market._totalBorrowNative
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(market.inputTokenPricesUSD[0]);
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  borrow.amountUSD = market.inputTokenPricesUSD[0].times(decimalAmount);

  // update borrow volume (ie, market.totalVolumeUSD)
  market.totalVolumeUSD = market.totalVolumeUSD.plus(borrow.amountUSD!);
  // update total volume on protocol level
  let protocol = getOrCreateLendingProtcol();
  protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(borrow.amountUSD!);

  // update protocol totalBorrowUSD
  updateTotalBorrowUSD(event);

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
  repay.asset = market.inputTokens[0];
  repay.amount = amount;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(market);
    updateMarketPrices(market, event);
    updateMarketRates(market);
    accrueInterestsOnBalances(market);
    updateRewards(event, market);
    market._currentBlockNumber = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  market._totalBorrowNative = market._totalBorrowNative.minus(amount); // must be after revenue updates
  market.totalBorrowUSD = market._totalBorrowNative
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(market.inputTokenPricesUSD[0]);
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  repay.amountUSD = market.inputTokenPricesUSD[0].times(decimalAmount);

  // update protocol totalBorrowUSD
  updateTotalBorrowUSD(event);

  market.save();
  repay.save();
  return true;
}

// create Liquidation entity, return false if any markets are null
export function createLiquidation(
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

  // create liquidation entity
  let liquidation = new Liquidation(id);

  // populate liquidations vars
  liquidation.hash = transactionHash;
  liquidation.logIndex = logIndex.toI32();
  liquidation.protocol = COMPTROLLER_ADDRESS;
  liquidation.to = marketAddress.toHexString();
  liquidation.from = liquidator.toHexString();
  liquidation.blockNumber = blockNumber;
  liquidation.timestamp = event.block.timestamp;
  liquidation.market = marketAddress.toHexString();

  // get liquidated underlying address
  let liquidatedMarket = getOrCreateMarket(event, liquidatedToken);
  let assetId = liquidatedMarket.inputTokens[0];
  if (assetId == null) {
    return false;
  }
  liquidation.asset = assetId;

  // get/update prices/rates/accrue interest/rewards for market
  if (market._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(market);
    updateMarketPrices(market, event);
    updateMarketRates(market);
    accrueInterestsOnBalances(market);
    updateRewards(event, market);
    market._currentBlockNumber = event.block.number;
  }
  if (liquidatedMarket._currentBlockNumber < event.block.number) {
    updatePrevBlockRevenues(liquidatedMarket);
    updateMarketPrices(liquidatedMarket, event);
    updateMarketRates(liquidatedMarket);
    accrueInterestsOnBalances(liquidatedMarket);
    updateRewards(event, liquidatedMarket);
    liquidatedMarket._currentBlockNumber = event.block.number;
  }
  let underlyingDecimals = getOrCreateToken(liquidation.asset).decimals;
  let liquidatedExchangeRate = getExchangeRate(Address.fromString(liquidatedMarket.id));

  // calc amount/amountUSD/profitUSD
  liquidation.amount = liquidatedAmount
    .times(liquidatedExchangeRate)
    .div(BigInt.fromI32(10).pow(DEFAULT_DECIMALS as u8));
  liquidation.amountUSD = liquidation.amount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(liquidatedMarket.inputTokenPricesUSD[0]);
  let repayUnderlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let costUSD: BigDecimal = repaidAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(repayUnderlyingDecimals))
    .times(market.inputTokenPricesUSD[0]);
  liquidation.profitUSD = liquidation.amountUSD!.minus(costUSD);

  liquidatedMarket.save();
  market.save();
  liquidation.save();
  return true;
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// must happen before any other fields are updated for the new block
// b/c we want to capture all of the revenue from the previous block
export function updatePrevBlockRevenues(market: Market): void {
  // update revenues for prev block
  let borrowRatePerBlock = market.variableBorrowRate.div(BLOCKS_PER_YEAR);
  market._supplySideRevenueUSDPerBlock = market.totalBorrowUSD
    .times(borrowRatePerBlock)
    .times(BIGDECIMAL_ONE.minus(market._reserveFactor));
  market._protocolSideRevenueUSDPerBlock = market.totalBorrowUSD.times(borrowRatePerBlock).times(market._reserveFactor);
  market._totalRevenueUSDPerBlock = market.totalBorrowUSD.times(borrowRatePerBlock);

  market.save();
}

// accrue interests on outstanding borrows and supplys
export function accrueInterestsOnBalances(market: Market): void {
  let accruedSupplyInterest = market.inputTokenBalances[0]
    .toBigDecimal()
    .times(market.depositRate.div(BLOCKS_PER_YEAR));
  let newInterestBigInt = BigInt.fromString(accruedSupplyInterest.truncate(0).toString());
  market.inputTokenBalances[0] = market.inputTokenBalances[0].plus(newInterestBigInt);

  let accruedBorrowedInterest = market._totalBorrowNative
    .toBigDecimal()
    .times(market.variableBorrowRate.div(BLOCKS_PER_YEAR));
  let newBorrowInterestBigInt = BigInt.fromString(accruedBorrowedInterest.truncate(0).toString());
  market._totalBorrowNative = market._totalBorrowNative.plus(newBorrowInterestBigInt);

  market.save();
}

export function updateMarketPrices(market: Market, event: ethereum.Event): void {
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
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
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  let inputTokenPrice = new Array<BigDecimal>();
  inputTokenPrice.push(getUSDPriceOfToken(market, event.block.number.toI32()));
  market.inputTokenPricesUSD = inputTokenPrice;
  market.outputTokenPriceUSD = market._exchangeRate.times(market.inputTokenPricesUSD[0]);

  market.save();
}

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  // loop through each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    let inputTokenPrice = new Array<BigDecimal>();
    inputTokenPrice.push(getUSDPriceOfToken(market, event.block.number.toI32()));
    market.inputTokenPricesUSD = inputTokenPrice;
    let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
    market.totalValueLockedUSD = market.inputTokenBalances[0]
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPricesUSD[0]);
    totalValueLockedUSD = totalValueLockedUSD.plus(market.totalValueLockedUSD);
    market.save();
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function updateTotalBorrowUSD(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalBorrowUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    let inputTokenPrice = new Array<BigDecimal>();
    inputTokenPrice.push(getUSDPriceOfToken(market, event.block.number.toI32()));
    market.inputTokenPricesUSD = inputTokenPrice;
    let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
    market.totalBorrowUSD = market._totalBorrowNative
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPricesUSD[0]);
    totalBorrowUSD = totalBorrowUSD.plus(market.totalBorrowUSD);
    market.save();
  }
  protocol.totalBorrowUSD = totalBorrowUSD;
  protocol.save();
}

export function updateTotalDepositUSD(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalDepositUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    let inputTokenPrice = new Array<BigDecimal>();
    inputTokenPrice.push(getUSDPriceOfToken(market, event.block.number.toI32()));
    market.inputTokenPricesUSD = inputTokenPrice;
    let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
    market.totalDepositUSD = market.inputTokenBalances[0]
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market.inputTokenPricesUSD[0]);
    totalDepositUSD = totalDepositUSD.plus(market.totalDepositUSD);
    market.save();
  }
  protocol.totalDepositUSD = totalDepositUSD;
  protocol.save();
}

export function updateRewards(event: ethereum.Event, market: Market): void {
  // COMP was not created until block 9601359
  if (event.block.number.toI32() > 9601359) {
    let rewardTokenBorrow: RewardToken | null = null;
    let rewardTokenDeposit: RewardToken | null = null;
    // check if market has COMP reward tokens
    if (market.rewardTokens == null) {
      rewardTokenDeposit = getOrCreateRewardToken(market.id, Address.fromString(COMP_ADDRESS), RewardTokenType.DEPOSIT);
      rewardTokenBorrow = getOrCreateRewardToken(market.id, Address.fromString(COMP_ADDRESS), RewardTokenType.BORROW);
      let rewardTokenArr = new Array<string>();
      rewardTokenArr.push(rewardTokenDeposit.id);
      rewardTokenArr.push(rewardTokenBorrow.id);
      market.rewardTokens = rewardTokenArr;
    }

    // get COMP distribution/block
    if (rewardTokenBorrow == null) {
      rewardTokenBorrow = getOrCreateRewardToken(market.id, Address.fromString(COMP_ADDRESS), RewardTokenType.BORROW);
    }
    let rewardDecimals = rewardTokenBorrow.decimals;
    let troller = Comptroller.bind(Address.fromString(COMPTROLLER_ADDRESS));
    let tryDistribution = troller.try_compSpeeds(event.address);

    // get comp speed per day - this is the distribution amount for supplying and borrowing
    let compPerDay = tryDistribution.reverted
      ? BIGINT_ZERO
      : tryDistribution.value
          .times(BigInt.fromI32(4)) // 4 blocks/min
          .times(BigInt.fromI32(60)) // 60 mins/hr
          .times(BigInt.fromI32(24)); // 24 hrs/day
    let compPriceUSD = BIGDECIMAL_ZERO;

    // cCOMP was made at this block height 10960099
    if (event.block.number.toI32() > 10960099) {
      let compMarket = getOrCreateMarket(event, Address.fromString(CCOMP_ADDRESS));
      compPriceUSD = getUSDPriceOfToken(compMarket, event.block.number.toI32());
    } else {
      // try to get COMP price using assetPrices() and prices[] mapping in SimplePriceOracle.sol
      let protocol = getOrCreateLendingProtcol();
      let oracleAddress = changetype<Address>(protocol._priceOracle);
      let oracle = PriceOracle2.bind(oracleAddress);
      compPriceUSD = oracle.assetPrices(Address.fromString(COMP_ADDRESS)).toBigDecimal().div(exponentToBigDecimal(6)); // price returned with 6 decimals of precision per docs
    }

    let compPerDayUSD = compPerDay.toBigDecimal().div(exponentToBigDecimal(rewardDecimals)).times(compPriceUSD);

    let compAmountArr = new Array<BigInt>();
    compAmountArr.push(compPerDay);
    compAmountArr.push(compPerDay);
    market.rewardTokenEmissionsAmount = compAmountArr;

    let compAmountUSDArr = new Array<BigDecimal>();
    compAmountUSDArr.push(compPerDayUSD);
    compAmountUSDArr.push(compPerDayUSD);
    market.rewardTokenEmissionsUSD = compAmountUSDArr;

    market.save();
  }
}

export function updateMarketRates(market: Market): void {
  // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
  // So we handle it like this.
  let contract = CToken.bind(Address.fromString(market.id));
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let trySupplyRatePerBlock = contract.try_supplyRatePerBlock();
  market.depositRate = trySupplyRatePerBlock.reverted
    ? BIGDECIMAL_ZERO
    : trySupplyRatePerBlock.value
        .toBigDecimal()
        .times(BLOCKS_PER_YEAR)
        .div(mantissaFactorBD)
        .truncate(DEFAULT_DECIMALS);

  // update borrow rates
  // Compound doesn't have "stable borrow rates" so the two equal each other
  // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
  let tryBorrowRatePerBlock = contract.try_borrowRatePerBlock();
  let borrowRate = tryBorrowRatePerBlock.reverted
    ? BIGDECIMAL_ZERO
    : tryBorrowRatePerBlock.value
        .toBigDecimal()
        .times(BLOCKS_PER_YEAR)
        .div(mantissaFactorBD)
        .truncate(DEFAULT_DECIMALS);
  market.stableBorrowRate = borrowRate;
  market.variableBorrowRate = borrowRate;

  market.save();
}
