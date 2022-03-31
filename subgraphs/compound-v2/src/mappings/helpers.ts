// helper functions for ./mappings.ts

import { Token, Market, Deposit, Withdraw, Borrow, Repay, Liquidation, RewardToken } from "../types/schema";

import { COMPTROLLER_ADDRESS, ZERO_ADDRESS, COMP_ADDRESS, CETH_ADDRESS } from "../common/utils/constants";

import { BIGDECIMAL_ZERO, BIGINT_ZERO, ETH_ADDRESS, SAI_ADDRESS } from "../common/utils/constants";

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { CToken } from "../types/Comptroller/cToken";
import { getAmountUSD } from "../common/prices/prices";
import {
  getOrCreateCToken,
  getOrCreateLendingProtcol,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { exchangecTokenForTokenAmount } from "../common/utils/utils";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

// create a Deposit entity, return false if transaction is null
// null = market does not exist
export function createDeposit(event: ethereum.Event, amount: BigInt, sender: Address): bool {
  // grab and store market
  let marketAddress = event.transaction.to!;
  let market = Market.load(marketAddress.toHexString());
  if (market == null) {
    log.error("Market {} does not exist", [marketAddress.toHexString()]);
    return false;
  }

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
  deposit.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());

  deposit.save();

  // update TVL
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(deposit.amountUSD);
  let protocol = getOrCreateLendingProtcol();
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(deposit.amountUSD);
  market.save();
  protocol.save();

  // TODO: update token balances and supply

  return true;
}

// creates a withdraw entity, returns false if market does not exist
export function createWithdraw(event: ethereum.Event, redeemer: Address, amount: BigInt): bool {
  // grab and store market entity
  let marketAddress = event.transaction.from;
  let market = Market.load(marketAddress.toHexString());
  if (market == null) {
    log.error("Market {} does not exist", [marketAddress.toHexString()]);
    return false;
  }

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
  withdraw.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());

  withdraw.save();
  return true;
}

export function createBorrow(event: ethereum.Event, borrower: Address, amount: BigInt): bool {
  // grab and store market entity
  let marketAddress = event.transaction.from;
  let market = Market.load(marketAddress.toHexString());
  if (market == null) {
    log.error("Market {} does not exist", [marketAddress.toHexString()]);
    return false;
  }
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
  borrow.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());

  borrow.save();
  return true;
}

// create Repay entity, return false if market does not exist
export function createRepay(event: ethereum.Event, payer: Address, amount: BigInt): bool {
  // grab and store market entity
  let marketAddress = event.transaction.to!;
  let market = Market.load(marketAddress.toHexString());
  if (market == null) {
    log.error("Market {} does not exist", [marketAddress.toHexString()]);
    return false;
  }

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
  repay.amountUSD = getAmountUSD(market, amount, blockNumber.toI32());

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
  let marketAddress = event.transaction.to!;
  let market = Market.load(marketAddress.toHexString());
  if (market == null) {
    log.error("Market {} does not exist", [marketAddress.toHexString()]);
    return false;
  }
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
  let liquidatedMarket = Market.load(liquidatedToken.toHexString());
  if (liquidatedMarket == null) {
    return false;
  }
  let assetId = liquidatedMarket.inputTokens[0];
  if (assetId == null) {
    return false;
  }
  liquidation.asset = assetId;

  // calculate asset amount from siezeTokens (call exchangecTokenForTokenAmount)
  let assetAmount = exchangecTokenForTokenAmount(liquidatedAmount, liquidatedToken);
  if (assetAmount == BIGINT_ZERO) {
    log.error("Exchange rate failed: returned 0", []);
  }
  liquidation.amount = assetAmount;
  liquidation.amountUSD = getAmountUSD(liquidatedMarket, assetAmount, blockNumber.toI32());

  // calculate profit = (liquidatedAmountUSD - repaidAmountUSD)
  let costUSD = getAmountUSD(market, repaidAmount, blockNumber.toI32());
  liquidation.profitUSD = liquidation.amountUSD!.minus(costUSD);

  liquidation.save();
  return true;
}

///////////////////////////////
//// Market/Token Entities ////
///////////////////////////////

// creates a new lending market and returns it
export function createMarket(marketAddress: string, blockNumber: BigInt, timestamp: BigInt): Market {
  let market = new Market(marketAddress);
  let cTokenContract = CToken.bind(Address.fromString(marketAddress));
  let underlyingAddress: string;
  let underlying = cTokenContract.try_underlying();
  if (marketAddress == CETH_ADDRESS) {
    underlyingAddress = ETH_ADDRESS;
  } else if (underlying.reverted) {
    underlyingAddress = ZERO_ADDRESS;
  } else {
    underlyingAddress = underlying.value.toHexString();
  }

  // add market id to protocol
  let protocol = getOrCreateLendingProtcol();
  let marketIds = protocol._marketIds;
  marketIds.push(marketAddress);
  protocol._marketIds = marketIds;
  protocol.save();

  // create Tokens
  let inputToken = getOrCreateToken(underlyingAddress);
  let rewardToken: RewardToken | null;
  let outputToken = getOrCreateCToken(Address.fromString(marketAddress), cTokenContract);

  // COMP was not created until block 9601359
  if (blockNumber.toI32() > 9601359) {
    rewardToken = getOrCreateRewardToken(Address.fromString(COMP_ADDRESS));
  } else {
    rewardToken = null;
  }

  // populate market vars
  market.protocol = COMPTROLLER_ADDRESS;

  // add tokens
  let inputTokens = new Array<string>();
  inputTokens.push(inputToken.id);
  market.inputTokens = inputTokens;
  market.outputToken = outputToken.id;
  if (rewardToken != null) {
    let rewardTokens = new Array<string>();
    rewardTokens.push(rewardToken.id);
    market.rewardTokens = rewardTokens;
  } else {
    market.rewardTokens = [];
  }

  // populate quantitative data
  market.totalValueLockedUSD = BIGDECIMAL_ZERO;
  market.totalVolumeUSD = BIGDECIMAL_ZERO;
  market.inputTokenBalances = [];
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.rewardTokenEmissionsAmount = [];
  market.rewardTokenEmissionsUSD = [];
  market.createdTimestamp = timestamp;
  market.createdBlockNumber = blockNumber;

  // lending-specific data
  if (underlyingAddress == SAI_ADDRESS) {
    market.name = "Dai Stablecoin v1.0 (DAI)";
  } else {
    market.name = inputToken.name;
  }
  market.isActive = true; // event MarketListed() makes a market active
  market.canUseAsCollateral = false; // until Collateral is taken out
  market.canBorrowFrom = false; // until Borrowed from

  // calculations data
  // TODO: figure out and do calcs
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.depositRate = BIGDECIMAL_ZERO;
  market.stableBorrowRate = BIGDECIMAL_ZERO;
  market.variableBorrowRate = BIGDECIMAL_ZERO;

  // add liquidation penalty if the protocol has it
  if (protocol._liquidationPenalty != BIGDECIMAL_ZERO) {
    market.liquidationPenalty = protocol._liquidationPenalty;
  } else {
    market.liquidationPenalty = BIGDECIMAL_ZERO;
  }

  return market;
}
