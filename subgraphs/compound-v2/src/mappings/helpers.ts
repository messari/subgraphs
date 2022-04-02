// helper functions for ./mappings.ts

import { Token, Market, Deposit, Withdraw, Borrow, Repay, Liquidation, RewardToken } from "../types/schema";

import {
  COMPTROLLER_ADDRESS,
  ZERO_ADDRESS,
  COMP_ADDRESS,
  CETH_ADDRESS,
  COMPOUND_DECIMALS,
} from "../common/utils/constants";

import { BIGDECIMAL_ZERO, BIGINT_ZERO, ETH_ADDRESS, SAI_ADDRESS } from "../common/utils/constants";

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { CToken } from "../types/Comptroller/cToken";
import { getUSDPriceOfToken } from "../common/prices/prices";
import {
  getOrCreateCToken,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { exponentToBigDecimal, getExchangeRate } from "../common/utils/utils";

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
  let mantissaFactor = 18;
  let mantissaFactorBD = exponentToBigDecimal(mantissaFactor);
  let exchangeRate = getExchangeRate(marketAddress, event);
  market._exchangeRate = exchangeRate
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(COMPOUND_DECIMALS))
    .div(mantissaFactorBD)
    .truncate(mantissaFactor);
  market._inputTokenPrice = getUSDPriceOfToken(market, event.block.number.toI32());
  let outputTokenPrice = market._exchangeRate.div(market._inputTokenPrice);
  market.outputTokenPriceUSD = outputTokenPrice;

  deposit.amountUSD = market._inputTokenPrice.times(decimalAmount);
  let mintedCTokens = amount.div(exchangeRate);
  market.outputTokenSupply = market.outputTokenSupply.plus(mintedCTokens);

  // update cToken supply
  market.outputTokenSupply = market.outputTokenSupply.plus(mintTokens);

  // update inputTokensBalance
  let inputBalance = market.inputTokenBalances;
  inputBalance = [inputBalance[0].plus(amount)];
  market.inputTokenBalances = inputBalance;

  // update TVL
  let inputDecimalAmount = inputBalance[0].toBigDecimal().div(exponentToBigDecimal(underlyingDecimals));
  market.totalValueLockedUSD = market._inputTokenPrice.times(inputDecimalAmount);

  // TODO: update protocol TVL

  // TODO: update token balances and supply

  market.save();
  deposit.save();
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
  // withdraw.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());
  withdraw.save();

  // TODO: can make this faster by saving token price and multiplying by that
  // even better if we pass it to other functions that need it
  // update TVL
  let inputBalance = market.inputTokenBalances;
  inputBalance = [inputBalance[0].minus(amount)];
  market.inputTokenBalances = inputBalance;
  // market.totalValueLockedUSD = getAmountUSD(market, inputBalance[0], blockNumber.toI32());
  // market._exchangeRate = getExchangeRate(marketAddress, event)

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
  // borrow.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());
  borrow.save();

  // update borrow volume
  // market.totalVolumeUSD = market.totalVolumeUSD.plus(borrow.amountUSD);

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
  // repay.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());

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
  liquidatedAmount: BigInt,
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

  // calculate asset amount from siezeTokens (call exchangecTokenForTokenAmount)
  // let assetAmount = exchangecTokenForTokenAmount(liquidatedAmount, liquidatedToken, event);
  // if (assetAmount == BIGDECIMAL_ZERO) {
  //   log.error("Exchange rate failed: returned 0", []);
  // }
  // liquidation.amount = assetAmount;
  // log.info("asset amount check: {}", [assetAmount.toString()]);
  // liquidation.amountUSD = getAmountUSD(liquidatedMarket, assetAmount, blockNumber.toI32());

  // calculate profit = (liquidatedAmountUSD - repaidAmountUSD)
  // let costUSD = getAmountUSD(market, repaidAmount, blockNumber.toI32());
  // liquidation.profitUSD = liquidation.amountUSD!.minus(costUSD);

  liquidation.save();
  return true;
}
