// helper functions for ./mappings.ts

import { Market, Deposit, Withdraw, Borrow, Repay, Liquidation, RewardToken } from "../types/schema";

import {
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  COMPOUND_DECIMALS,
  DEFAULT_DECIMALS,
  BLOCKS_PER_YEAR,
  RewardTokenType,
  CCOMP_ADDRESS,
} from "../common/utils/constants";

import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../common/utils/constants";

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { CToken } from "../types/Comptroller/cToken";
import { getUSDPriceOfToken } from "../common/prices/prices";
import {
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { exponentToBigDecimal, getExchangeRate } from "../common/utils/utils";
import { Comptroller } from "../types/Comptroller/Comptroller";

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

  // get/update prices for market
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let exchangeRate = getExchangeRate(marketAddress, event);
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market._inputTokenPrice = getUSDPriceOfToken(market, event.block.number.toI32());
  market.outputTokenPriceUSD = market._exchangeRate.times(market._inputTokenPrice);
  deposit.amountUSD = market._inputTokenPrice.times(decimalAmount);

  // update cToken supply
  market.outputTokenSupply = market.outputTokenSupply.plus(mintTokens);

  // update inputTokensBalance
  let inputBalance = market.inputTokenBalances;
  inputBalance = [inputBalance[0].plus(amount)];
  market.inputTokenBalances = inputBalance;

  market.save();
  deposit.save();
  updateProtocolTVL(event); // also updates market TVL
  updateMarketRates(market);
  updateRewards(event, market);
  return true;
}

// creates a withdraw entity, returns false if market does not exist
export function createWithdraw(event: ethereum.Event, redeemer: Address, amount: BigInt): bool {
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
  withdraw.amount = amount;

  // update market vars and calc amountUSD
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let exchangeRate = getExchangeRate(marketAddress, event);
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market._inputTokenPrice = getUSDPriceOfToken(market, blockNumber.toI32());
  market.outputTokenPriceUSD = market._exchangeRate.times(market._inputTokenPrice);
  withdraw.amountUSD = market._inputTokenPrice.times(decimalAmount);

  updateMarketRates(market);

  withdraw.save();
  market.save();
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
  market._outstandingBorrowAmount = market._outstandingBorrowAmount.plus(amount);

  // update market vars and calc amountUSD
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let exchangeRate = getExchangeRate(marketAddress, event);
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market._inputTokenPrice = getUSDPriceOfToken(market, blockNumber.toI32());
  market.outputTokenPriceUSD = market._exchangeRate.times(market._inputTokenPrice);
  borrow.amountUSD = market._inputTokenPrice.times(decimalAmount);

  // update borrow volume (ie, market.totalVolumeUSD)
  market.totalVolumeUSD = market.totalVolumeUSD.plus(borrow.amountUSD!);
  // update total volume on protocol level
  let protocol = getOrCreateLendingProtcol();
  protocol._totalVolumeUSD = protocol._totalVolumeUSD.plus(borrow.amountUSD!);

  updateMarketRates(market);

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
  market._outstandingBorrowAmount = market._outstandingBorrowAmount.minus(amount);

  // update market vars and calc amountUSD
  let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  let decimalAmount = amount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let exchangeRate = getExchangeRate(marketAddress, event);
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market._inputTokenPrice = getUSDPriceOfToken(market, blockNumber.toI32());
  market.outputTokenPriceUSD = market._exchangeRate.times(market._inputTokenPrice);
  repay.amountUSD = market._inputTokenPrice.times(decimalAmount);

  updateMarketRates(market);

  market.save();
  repay.save();
  return true;
}

// create Liquidation entity, return false if any markets are null
// TODO: verify logic
// TODO: instead of exchanging cTokens to tokens calculate cToken Price
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

  // update liquidatedMarket vars
  let underlyingDecimals = getOrCreateToken(liquidation.asset).decimals;
  let mantissaFactorBD = exponentToBigDecimal(DEFAULT_DECIMALS);
  let liquidatedExchangeRate = getExchangeRate(Address.fromString(liquidatedMarket.id), event);
  liquidatedMarket._exchangeRate = liquidatedExchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  liquidatedMarket._inputTokenPrice = getUSDPriceOfToken(liquidatedMarket, blockNumber.toI32());
  liquidatedMarket.outputTokenPriceUSD = liquidatedMarket._exchangeRate.times(liquidatedMarket._inputTokenPrice);

  // calc amount/amountUSD/profitUSD
  liquidation.amount = liquidatedAmount
    .times(liquidatedExchangeRate)
    .div(BigInt.fromI32(10).pow(DEFAULT_DECIMALS as u8));
  liquidation.amountUSD = liquidation.amount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(liquidatedMarket._inputTokenPrice);

  // update market inputTokenPrice
  let repayUnderlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
  market._inputTokenPrice = getUSDPriceOfToken(market, blockNumber.toI32());
  let costUSD: BigDecimal = repaidAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(repayUnderlyingDecimals))
    .times(market._inputTokenPrice);
  liquidation.profitUSD = liquidation.amountUSD!.minus(costUSD);

  updateMarketRates(market);
  updateMarketRates(liquidatedMarket);

  liquidatedMarket.save();
  market.save();
  liquidation.save();
  return true;
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtcol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  // loop through each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    market._inputTokenPrice = getUSDPriceOfToken(market, event.block.number.toI32());
    let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
    let inputDecimalAmount = market.inputTokenBalances[0].toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
    market.totalValueLockedUSD = market._inputTokenPrice.times(inputDecimalAmount);
    totalValueLockedUSD = totalValueLockedUSD.plus(market.totalValueLockedUSD);
    market.save();
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
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
    } // TODO: how to get COMP price before block 10960099

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
  let supplyRatePerBlock = contract.try_supplyRatePerBlock();
  if (supplyRatePerBlock.reverted) {
    log.info("***CALL FAILED*** : cERC20 supplyRatePerBlock() reverted", []);
    market.depositRate = BIGDECIMAL_ZERO;
  } else {
    market.depositRate = supplyRatePerBlock.value
      .toBigDecimal()
      .times(BLOCKS_PER_YEAR)
      .div(mantissaFactorBD)
      .truncate(DEFAULT_DECIMALS);
  }

  // update borrow rates
  // Compound doesn't have "stable borrow rates" so the two equal each other
  // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
  let borrowRate = contract
    .borrowRatePerBlock()
    .toBigDecimal()
    .times(BLOCKS_PER_YEAR)
    .div(mantissaFactorBD)
    .truncate(DEFAULT_DECIMALS);
  market.stableBorrowRate = borrowRate;
  market.variableBorrowRate = borrowRate;

  market.save();
}
