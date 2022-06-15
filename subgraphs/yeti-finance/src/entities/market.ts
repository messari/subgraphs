import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
} from "../../generated/schema";
import {
  ACTIVE_POOL,
  ACTIVE_POOL_CREATED_BLOCK,
  ACTIVE_POOL_CREATED_TIMESTAMP,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  LIQUIDATION_FEE,
  MAXIMUM_LTV,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import {
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  getOrCreateYetiProtocol,
  updateProtocolBorrowBalance,
  updateProtocolUSDLocked,
} from "./protocol";
import { getOrCreateToken } from "./token";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getOrCreateStableBorrowerInterestRate } from "./rate";
import { getUSDPrice } from "../utils/price";

export function getOrCreateMarket(token: Address): Market {
  let market = Market.load(ACTIVE_POOL + "-" + token.toHexString());
  if (!market) {
    market = new Market(ACTIVE_POOL);
    market.protocol = getOrCreateYetiProtocol().id;
    market.name = "Yeti Finance";
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = MAXIMUM_LTV;
    market.liquidationThreshold = MAXIMUM_LTV;
    market.liquidationPenalty = LIQUIDATION_FEE;
    market.inputToken = getOrCreateToken(token).id;
    market.rates = [getOrCreateStableBorrowerInterestRate(ACTIVE_POOL).id];
    market.createdTimestamp = ACTIVE_POOL_CREATED_TIMESTAMP;
    market.createdBlockNumber = ACTIVE_POOL_CREATED_BLOCK;
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.save();
  }
  return market;
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
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
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
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function setMarketYUSDDebt(
  event: ethereum.Event,
  debtYUSD: BigInt
): void {
  const debtUSD = bigIntToBigDecimal(debtYUSD);
  updateProtocolBorrowBalance(event, debtUSD, debtYUSD);
}

export function setMarketAssetBalance(
  event: ethereum.Event,
  balance: BigInt,
  tokenAddr: Address
): void {
  const tokenPrice = getUSDPrice(tokenAddr);
  const token = getOrCreateToken(tokenAddr);
  const balanceUSD = tokenPrice
    .times(balance.toBigDecimal())
    .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
  const market = getOrCreateMarket(tokenAddr);
  const netChangeUSD = balanceUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = balanceUSD;
  market.totalDepositBalanceUSD = balanceUSD;
  market.inputTokenBalance = balance;
  market.inputTokenPriceUSD = tokenPrice;

  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolUSDLocked(event, netChangeUSD);
}

export function addMarketDepositVolume(
  event: ethereum.Event,
  depositedUSD: BigDecimal,
  token: Address
): void {
  const market = getOrCreateMarket(token);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(depositedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyDepositUSD =
    dailySnapshot.dailyDepositUSD.plus(depositedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyDepositUSD =
    hourlySnapshot.hourlyDepositUSD.plus(depositedUSD);
  hourlySnapshot.save();
  addProtocolDepositVolume(event, depositedUSD);
}

export function addMarketLiquidateVolume(
  event: ethereum.Event,
  liquidatedUSD: BigDecimal,
  token: Address
): void {
  const market = getOrCreateMarket(token);
  market.cumulativeLiquidateUSD =
    market.cumulativeLiquidateUSD.plus(liquidatedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyLiquidateUSD =
    dailySnapshot.dailyLiquidateUSD.plus(liquidatedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyLiquidateUSD =
    hourlySnapshot.hourlyLiquidateUSD.plus(liquidatedUSD);
  hourlySnapshot.save();
  addProtocolLiquidateVolume(event, liquidatedUSD);
}

export function addMarketBorrowVolume(
  event: ethereum.Event,
  borrowedUSD: BigDecimal,
  token: Address
): void {
  const market = getOrCreateMarket(token);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrowedUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(borrowedUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyBorrowUSD =
    hourlySnapshot.hourlyBorrowUSD.plus(borrowedUSD);
  hourlySnapshot.save();
  addProtocolBorrowVolume(event, borrowedUSD);
}
