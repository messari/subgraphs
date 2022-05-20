// map blockchain data to entities outlined in schema.graphql
import {
  ActionPaused1,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../generated/Comptroller/Comptroller";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
  updateRevenue,
  updateTotalBorrowUSD,
} from "./helpers";
import {
  Mint as MintNew,
  Redeem as RedeemNew,
  Borrow as BorrowNew,
  RepayBorrow as RepayBorrowNew,
  LiquidateBorrow as LiquidateBorrowNew,
  AccrueInterest as AccrueInterestNew,
  NewReserveFactor as NewReserveFactorNew,
} from "../../generated/templates/CTokenNew/CTokenNew";
import {
  Mint as MintOld,
  Redeem as RedeemOld,
  Borrow as BorrowOld,
  RepayBorrow as RepayBorrowOld,
  LiquidateBorrow as LiquidateBorrowOld,
  AccrueInterest as AccrueInterestOld,
  NewReserveFactor as NewReserveFactorOld,
} from "../../generated/templates/CTokenOld/CTokenOld";
import { CTokenOld, CTokenNew } from "../../generated/templates";
import {
  updateFinancials,
  updateMarketDailyMetrics,
  updateMarketHourlyMetrics,
  updateUsageMetrics,
} from "../common/metrics";
import { getOrCreateLendingProtcol, getOrCreateMarket } from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONEHUNDRED,
  BIGDECIMAL_ZERO,
  COLLATERAL_FACTOR_OFFSET,
  DEFAULT_DECIMALS,
  TransactionType,
} from "../common/utils/constants";

//////////////////////////////////
//// CTokenNew Level Handlers ////
//////////////////////////////////

export function handleMintNew(event: MintNew): void {
  mint(event, event.params.mintAmount, event.params.mintTokens, event.params.minter);
}

export function handleRedeemNew(event: RedeemNew): void {
  redeem(event, event.params.redeemer, event.params.redeemAmount, event.params.redeemTokens);
}

export function handleBorrowNew(event: BorrowNew): void {
  borrow(event, event.params.borrower, event.params.borrowAmount);
}

export function handleRepayBorrowNew(event: RepayBorrowNew): void {
  repayBorrow(event, event.params.payer, event.params.repayAmount);
}

export function handleLiquidateBorrowNew(event: LiquidateBorrowNew): void {
  liquidateBorrow(
    event,
    event.params.cTokenCollateral,
    event.params.liquidator,
    event.params.seizeTokens,
    event.params.repayAmount,
  );
}

export function handleNewReserveFactorNew(event: NewReserveFactorNew): void {
  newReserveFactor(event, event.params.newReserveFactorMantissa);
}

// this version of AccrueInterest has 4 parameters
export function handleAccrueInterestNew(event: AccrueInterestNew): void {
  accrueInterest(event, event.params.interestAccumulated, event.params.totalBorrows);
}

//////////////////////////////////
//// CTokenOld Level Handlers ////
//////////////////////////////////

export function handleMintOld(event: MintOld): void {
  mint(event, event.params.mintAmount, event.params.mintTokens, event.params.minter);
}

export function handleRedeemOld(event: RedeemOld): void {
  redeem(event, event.params.redeemer, event.params.redeemAmount, event.params.redeemTokens);
}

export function handleBorrowOld(event: BorrowOld): void {
  borrow(event, event.params.borrower, event.params.borrowAmount);
}

export function handleRepayBorrowOld(event: RepayBorrowOld): void {
  repayBorrow(event, event.params.payer, event.params.repayAmount);
}

export function handleLiquidateBorrowOld(event: LiquidateBorrowOld): void {
  liquidateBorrow(
    event,
    event.params.cTokenCollateral,
    event.params.liquidator,
    event.params.seizeTokens,
    event.params.repayAmount,
  );
}

export function handleNewReserveFactorOld(event: NewReserveFactorOld): void {
  newReserveFactor(event, event.params.newReserveFactorMantissa);
}

// this version of AccrueInterest has 4 parameters
export function handleAccrueInterestOld(event: AccrueInterestOld): void {
  accrueInterest(event, event.params.interestAccumulated, event.params.totalBorrows);
}

////////////////////////////////////
//// Comptroller Level Handlers ////
////////////////////////////////////

export function handleMarketListed(event: MarketListed): void {
  // create new market now that the data source is instantiated

  // create CToken with new abi
  if (event.block.number.toI32() >= 8983575) {
    CTokenNew.create(event.params.cToken);
  } else {
    // create CToken with old abi
    CTokenOld.create(event.params.cToken);
  }
  let market = getOrCreateMarket(event, event.params.cToken);

  // add market to protocol marketId list
  let protocol = getOrCreateLendingProtcol();
  let ids = protocol._marketIds;
  ids.push(market.id);
  protocol._marketIds = ids;

  protocol.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  // create LendingProtocol - first function to be called in Comptroller
  let lendingProtocol = getOrCreateLendingProtcol();

  lendingProtocol._priceOracle = event.params.newPriceOracle;
  lendingProtocol.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = getOrCreateMarket(event, event.params.cToken);
  let newLTV = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(COLLATERAL_FACTOR_OFFSET));
  market.maximumLTV = newLTV;
  // collateral factor is the borrowing capacity. The liquidity a borrower has is the collateral factor
  // ex: if collateral factor = 75% and the user has 100 USD (normalized) they can borrow $75
  //     if that ratio rises above 75% they are at risk of liquidation
  market.liquidationThreshold = newLTV;

  if (market.maximumLTV == BIGDECIMAL_ZERO) {
    // when collateral factor is 0 the asset CANNOT be used as collateral
    market.canUseAsCollateral = false;
  }

  market.save();
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let protocol = getOrCreateLendingProtcol();
  let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
    .minus(BIGDECIMAL_ONEHUNDRED);
  protocol._liquidationPenalty = liquidationPenalty;
  protocol.save();

  // set liquidation penalty for each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    market.liquidationPenalty = liquidationPenalty;
    market.save();
  }
}

export function handleActionPaused(event: ActionPaused1): void {
  let market = getOrCreateMarket(event, event.params.cToken);
  if (event.params.action == "Mint") {
    market.isActive = event.params.pauseState;
  } else if (event.params.action == "Borrow") {
    market.canBorrowFrom = event.params.pauseState;
  }

  market.save();
}

////////////////////////
//// CToken Helpers ////
////////////////////////

function mint(event: ethereum.Event, mintAmount: BigInt, mintTokens: BigInt, minter: Address): void {
  if (createDeposit(event, mintAmount, mintTokens, minter)) {
    updateUsageMetrics(event, minter, TransactionType.DEPOSIT);
    updateFinancials(event);
    updateMarketDailyMetrics(event);
    updateMarketHourlyMetrics(event);
  }
}

function redeem(event: ethereum.Event, redeemer: Address, redeemAmount: BigInt, redeemTokens: BigInt): void {
  if (createWithdraw(event, redeemer, redeemAmount, redeemTokens)) {
    updateUsageMetrics(event, redeemer, TransactionType.WITHDRAW);
    updateFinancials(event);
    updateMarketDailyMetrics(event);
    updateMarketHourlyMetrics(event);
  }
}

function borrow(event: ethereum.Event, borrower: Address, borrowAmount: BigInt): void {
  if (createBorrow(event, borrower, borrowAmount)) {
    updateUsageMetrics(event, borrower, TransactionType.BORROW);
    updateFinancials(event);
    updateMarketDailyMetrics(event);
    updateMarketHourlyMetrics(event);
  }
}

function repayBorrow(event: ethereum.Event, payer: Address, repayAmount: BigInt): void {
  if (createRepay(event, payer, repayAmount)) {
    updateUsageMetrics(event, payer, TransactionType.REPAY);
    updateFinancials(event);
    updateMarketDailyMetrics(event);
    updateMarketHourlyMetrics(event);
  }
}

function liquidateBorrow(
  event: ethereum.Event,
  cTokenCollateral: Address,
  liquidator: Address,
  seizeTokens: BigInt,
  repayAmount: BigInt,
): void {
  if (createLiquidate(event, cTokenCollateral, liquidator, seizeTokens, repayAmount)) {
    updateUsageMetrics(event, liquidator, TransactionType.LIQUIDATE);
    updateFinancials(event);
    updateMarketDailyMetrics(event);
    updateMarketHourlyMetrics(event);
  }
}

function newReserveFactor(event: ethereum.Event, newReserveFactorMantissa: BigInt): void {
  let market = getOrCreateMarket(event, event.address);
  market._reserveFactor = newReserveFactorMantissa.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
  market.save();
}

function accrueInterest(event: ethereum.Event, newInterest: BigInt, newTotalBorrow: BigInt): void {
  updateRevenue(event, newInterest);
  updateTotalBorrowUSD(event, newTotalBorrow);
}
