import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { erc20QiStablecoin } from "../../generated/templates/Vault/erc20QiStablecoin";
import { QiStablecoin } from "../../generated/templates/Vault/QiStablecoin";
import {
  Borrow,
  Deposit,
  Liquidate,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  Repay,
  Token,
  Withdraw,
} from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  MATIC_ADDRESS,
  MATIC_MAXIMUM_LTV,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getCollateralPrice } from "./price";
import {
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  addProtocolSideRevenue,
  getOrCreateFinancialsSnapshot,
  getOrCreateLendingProtocol,
  updateProtocolBorrowBalance,
  updateProtocolTVL,
} from "./protocol";
import { getMaiToken, getOrCreateToken } from "./token";
import { getOrCreateStableBorrowerInterestRate } from "./rate";

export function getMarket(address: Address): Market {
  const id = address.toHexString();
  return Market.load(id)!;
}

export function createERC20Market(event: ethereum.Event): void {
  const id = event.address.toHexString();
  let market = Market.load(id);
  if (!market) {
    const contract = erc20QiStablecoin.bind(event.address);
    const protocol = getOrCreateLendingProtocol()
    market = new Market(id);
    market.protocol = protocol.id;
    market.name = contract.name();
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.inputToken = getOrCreateToken(contract.collateral()).id;
    market.rates = [getOrCreateStableBorrowerInterestRate(id).id];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    // Set liquidationPenalty to 10 by default, in case it can't be read from contract
    market.liquidationPenalty = BIGDECIMAL_TEN;
    // Read LTV and liquidationPenalty from contract
    updateMetadata(market, contract);

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    protocol.totalPoolCount += 1;
    protocol.save();
    market.save();
  }
}

export function createMaticMarket(event: ethereum.Event): void {
  const id = event.address.toHexString();
  let market = Market.load(id);
  if (!market) {
    const contract = QiStablecoin.bind(event.address);
    const protocol = getOrCreateLendingProtocol()
    market = new Market(id);
    market.protocol = protocol.id;
    market.name = contract.name();
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.liquidationThreshold = MATIC_MAXIMUM_LTV;
    market.maximumLTV = MATIC_MAXIMUM_LTV;
    market.liquidationPenalty = BIGDECIMAL_TEN;
    market.inputToken = getOrCreateToken(MATIC_ADDRESS).id;
    market.rates = [getOrCreateStableBorrowerInterestRate(id).id];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount += 1;

    protocol.save();
    market.save();
  }
}

export function getOrCreateMarketSnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  let marketSnapshot = MarketDailySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;
    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  market: Market
): MarketHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hour: i64 = timestamp / SECONDS_PER_HOUR;
  const id = `${market.id}-${hour}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;
    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function handleMarketDeposit(
  event: ethereum.Event,
  market: Market,
  deposit: Deposit,
  token: Token
): void {
  const amount = deposit.amount;
  const amountUSD = deposit.amountUSD;
  market.inputTokenBalance = market.inputTokenBalance.plus(amount);
  updateTVL(event, market, token);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyDepositUSD = dailySnapshot.dailyDepositUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyDepositUSD =
    hourlySnapshot.hourlyDepositUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolDepositVolume(event, amountUSD);
}

export function handleMarketWithdraw(
  event: ethereum.Event,
  market: Market,
  withdraw: Withdraw,
  token: Token
): void {
  const amount = withdraw.amount;
  const amountUSD = withdraw.amountUSD;
  market.inputTokenBalance = market.inputTokenBalance.minus(amount);
  updateTVL(event, market, token);
  market.save();

  const protocol = getOrCreateLendingProtocol();
  const financialSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialSnapshot.dailyWithdrawUSD =
    financialSnapshot.dailyWithdrawUSD.plus(amountUSD)
  financialSnapshot.save();

  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyWithdrawUSD =
    dailySnapshot.dailyWithdrawUSD.plus(amountUSD);
  dailySnapshot.save();

  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyWithdrawUSD =
    hourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
  hourlySnapshot.save();
}

export function handleMarketLiquidate(
  event: ethereum.Event,
  market: Market,
  liquidate: Liquidate,
  token: Token
): void {
  const amount = liquidate.amount;
  const amountUSD = liquidate.amountUSD!;
  market.inputTokenBalance = market.inputTokenBalance.minus(amount);
  updateTVL(event, market, token);
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(amountUSD);
  updateMetadata(market);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyLiquidateUSD =
    dailySnapshot.dailyLiquidateUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyLiquidateUSD =
    hourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolLiquidateVolume(event, amountUSD);
}

export function handleMarketBorrow(
  event: ethereum.Event,
  market: Market,
  borrow: Borrow
): void {
  const amountUSD = borrow.amountUSD!;
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(amountUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyBorrowUSD =
    hourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolBorrowVolume(event, amountUSD);
  updateProtocolBorrowBalance(event, amountUSD);
}

export function handleMarketRepay(
  event: ethereum.Event,
  market: Market,
  repay: Repay
): void {
  const amountUSD = repay.amountUSD;
  updateMarketBorrowBalance(
    event,
    market,
    BIGDECIMAL_ZERO.minus(repay.amountUSD!)
  );

  const protocol = getOrCreateLendingProtocol();
  const financialSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialSnapshot.dailyRepayUSD = 
    financialSnapshot.dailyRepayUSD.plus(amountUSD)
  financialSnapshot.save();

  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyRepayUSD =
    dailySnapshot.dailyRepayUSD.plus(amountUSD);
  dailySnapshot.save();

  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyRepayUSD =
    hourlySnapshot.hourlyRepayUSD.plus(amountUSD);
  hourlySnapshot.save();
}

export function handleMarketClosingFee(
  event: ethereum.Event,
  market: Market,
  feeAmount: BigInt,
  token: Token
): void {
  const feeAmountUSD = bigIntToBigDecimal(feeAmount, token.decimals).times(
    getCollateralPrice(event, event.address, token)
  );
  market.inputTokenBalance = market.inputTokenBalance.minus(feeAmount);
  updateTVL(event, market, token);
  addProtocolSideRevenue(event, market, feeAmountUSD);
}

export function updateMarketBorrowBalance(
  event: ethereum.Event,
  market: Market,
  changeUSD: BigDecimal
): void {
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(changeUSD);
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(event, changeUSD);
}

function updateTVL(event: ethereum.Event, market: Market, token: Token): void {
  if (!token.lastPriceUSD) {
    return;
  }
  market.inputTokenPriceUSD = token.lastPriceUSD!;
  const totalValueLocked = bigIntToBigDecimal(
    market.inputTokenBalance,
    token.decimals
  ).times(market.inputTokenPriceUSD);
  updateProtocolTVL(event, totalValueLocked.minus(market.totalValueLockedUSD));
  market.totalValueLockedUSD = totalValueLocked;
  market.totalDepositBalanceUSD = totalValueLocked;
}

function updateMetadata(
  market: Market,
  contract: erc20QiStablecoin | null = null
): void {
  if (market.inputToken == MATIC_ADDRESS.toHexString()) {
    // No set/get functions in contract
    return;
  }
  if (contract == null) {
    contract = erc20QiStablecoin.bind(Address.fromString(market.id));
  }
  const minCollateralPercent = contract.try__minimumCollateralPercentage();
  if (!minCollateralPercent.reverted) {
    const maximumLTV = BIGDECIMAL_HUNDRED.div(
      minCollateralPercent.value.toBigDecimal()
    ).times(BIGDECIMAL_HUNDRED);
    market.maximumLTV = maximumLTV;
    market.liquidationThreshold = maximumLTV;
  }
  const gainRatio = contract.try_gainRatio();
  if (!gainRatio.reverted) {
    const decimals = gainRatio.value.toString().length - 1;
    const liquidationPenalty = bigIntToBigDecimal(gainRatio.value, decimals)
      .times(BIGDECIMAL_HUNDRED)
      .minus(BIGDECIMAL_HUNDRED);
    market.liquidationPenalty = liquidationPenalty;
  }
}
