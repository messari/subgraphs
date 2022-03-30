// helper functions for ./mappings.ts

import { Token, Market, RewardToken, Deposit, Withdraw, Borrow, Repay, Liquidation } from "../types/schema";

import {
  COMPTROLLER_ADDRESS,
  ZERO_ADDRESS,
  CCOMP_ADDRESS,
  COMP_ADDRESS,
  CETH_ADDRESS,
} from "../common/utils/constants";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  REWARD_TOKEN_TYPE,
  ETH_NAME,
  ETH_SYMBOL,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  SAI_ADDRESS,
} from "../common/utils/constants";

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { CToken } from "../types/Comptroller/cToken";
import { getAmountUSD } from "../common/prices/prices";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "../common/utils/tokens";
import { getOrCreateLendingProtcol } from "../common/getters";

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
  deposit.amountUSD = getAmountUSD(market, amount, blockNumber.toI32(), false);

  deposit.save();

  // update TVL
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(deposit.amountUSD);
  let protocol = getOrCreateLendingProtcol()
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(deposit.amountUSD)
  market.save()
  protocol.save()

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
  withdraw.amountUSD = getAmountUSD(market, amount, blockNumber.toI32(), false);

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
  borrow.amountUSD = getAmountUSD(market, amount, blockNumber.toI32(), false);

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
  repay.amountUSD = getAmountUSD(market, amount, blockNumber.toI32(), false);

  repay.save();
  return true;
}

// create Liquidation entity, return false if any markets are null
// TODO: USD price calcs broken
// TODO: price calcs for cTokens broken
export function createLiquidation(
  event: ethereum.Event,
  liquidatedToken: Address,
  liquidator: Address,
  liquidatedAmount: BigInt,
  repaidAmount: BigInt,
): bool {
  // grab and store market
  let marketAddress = liquidatedToken;
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
  let assetId = market.outputToken;
  if (assetId == null) {
    return false;
  }
  liquidation.asset = assetId!;
  liquidation.amount = liquidatedAmount;
  liquidation.amountUSD = getAmountUSD(market, liquidatedAmount, blockNumber.toI32(), true);

  // calculate profit = (liquidatedAmountUSD - repaidAmountUSD)
  let repayMarket = Market.load(event.transaction.to!.toHexString());
  if (repayMarket == null) {
    return false;
  }
  let costUSD = getAmountUSD(repayMarket, repaidAmount, blockNumber.toI32(), false);
  liquidation.profitUSD = liquidation.amountUSD!.minus(costUSD);

  liquidation.save();
  return true;
}

///////////////////////////////
//// Market/Token Entities ////
///////////////////////////////

// creates a new lending market and returns it
export function createMarket(marketAddress: string, protocol: string, blockNumber: BigInt, timestamp: BigInt): Market {
  let market = new Market(marketAddress);
  let cTokenContract = CToken.bind(Address.fromString(marketAddress));
  let underlyingAddress: string;
  let underlying = cTokenContract.try_underlying();
  if (underlying.reverted) {
    underlyingAddress = ZERO_ADDRESS;
  } else {
    underlyingAddress = underlying.value.toHexString();
  }

  // create cToken/erc20 Tokens
  createMarketTokens(marketAddress, underlyingAddress, cTokenContract);

  // populate market vars
  market.protocol = protocol;

  // add tokens
  if (marketAddress == CETH_ADDRESS) {
    underlyingAddress = ETH_ADDRESS;
  }
  let inputTokens = new Array<string>();
  inputTokens.push(underlyingAddress);
  market.inputTokens = inputTokens;
  market.outputToken = marketAddress;
  let rewardTokens = new Array<string>();
  rewardTokens.push(COMP_ADDRESS);
  market.rewardTokens = rewardTokens;

  // populate quantitative data
  market.totalValueLockedUSD = BIGDECIMAL_ZERO;
  market.totalVolumeUSD = BIGDECIMAL_ZERO;
  let inputTokenBalances = new Array<BigInt>();
  inputTokenBalances.push(BIGINT_ZERO);
  market.inputTokenBalances = inputTokenBalances;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.rewardTokenEmissionsAmount = inputTokenBalances;
  let rewardEmissionsUSD = new Array<BigDecimal>();
  rewardEmissionsUSD.push(BIGDECIMAL_ZERO);
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.createdTimestamp = timestamp;
  market.createdBlockNumber = blockNumber;

  // lending-specific data
  if (underlyingAddress == SAI_ADDRESS) {
    market.name = "Dai Stablecoin v1.0 (DAI)";
  } else {
    let inputToken = Token.load(underlyingAddress);
    if (inputToken == null) {
      market.name = "Unknown Name";
    } else {
      market.name = inputToken.name;
    }
  }
  market.isActive = true;
  market.canUseAsCollateral = false; // until Collateral is taken out
  market.canBorrowFrom = false; // until Borrowed from

  // calculations data
  // TODO: figure out and do calcs
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.liquidationPenalty = BIGDECIMAL_ZERO;
  market.depositRate = BIGDECIMAL_ZERO;
  market.stableBorrowRate = BIGDECIMAL_ZERO;
  market.variableBorrowRate = BIGDECIMAL_ZERO;

  return market;
}

// creates both tokens for a market pool token/cToken
export function createMarketTokens(marketAddress: string, underlyingAddress: string, cTokenContract: CToken): void {
  // create underlying token
  // TODO: fill in reward token once created on old markets?
  if (marketAddress == CCOMP_ADDRESS) {
    // create RewardToken COMP
    let rewardToken = new RewardToken(underlyingAddress);
    rewardToken.name = getAssetName(Address.fromString(underlyingAddress));
    rewardToken.symbol = getAssetSymbol(Address.fromString(underlyingAddress));
    rewardToken.decimals = getAssetDecimals(Address.fromString(underlyingAddress));
    rewardToken.type = REWARD_TOKEN_TYPE;
    rewardToken.save();
  } else if (marketAddress == CETH_ADDRESS) {
    // ETH has a unique makeup
    let ethToken = new Token(ETH_ADDRESS);
    ethToken.name = ETH_NAME;
    ethToken.symbol = ETH_SYMBOL;
    ethToken.decimals = DEFAULT_DECIMALS;
    ethToken.save();
  } else {
    // create ERC20 Token normally
    let token = new Token(underlyingAddress);

    token.name = getAssetName(Address.fromString(underlyingAddress));
    token.symbol = getAssetSymbol(Address.fromString(underlyingAddress));
    token.decimals = getAssetDecimals(Address.fromString(underlyingAddress));
    token.save();
  }

  // create pool token (ie, cToken)
  let cToken = new Token(marketAddress);
  cToken.name = cTokenContract.name();
  cToken.symbol = cTokenContract.symbol();
  cToken.decimals = cTokenContract.decimals();
  cToken.save();
}
