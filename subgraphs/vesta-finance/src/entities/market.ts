import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  InterestRate,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
} from "../../generated/schema";
import {
  ACTIVE_POOL_CREATED_BLOCK,
  ACTIVE_POOL_CREATED_TIMESTAMP,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  LIQUIDATION_FEE_PERCENT,
  MAXIMUM_LTV,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import {
  addProtocolMarketAssets,
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  decrementProtocolOpenPositionCount,
  getOrCreateFinancialsSnapshot,
  getOrCreateLendingProtocol,
  incrementProtocolPositionCount,
  updateProtocolBorrowBalance,
  updateProtocolUSDLocked,
  addProtocolWithdrawVolume,
  addProtocolRepayVolume,
} from "./protocol";
import { getOrCreateAssetToken, getCurrentAssetPrice } from "./token";
import { bigIntToBigDecimal, exponentToBigDecimal } from "../utils/numbers";
import { getOrCreateStableBorrowerInterestRate } from "./rate";
import { EventType } from "./event";

export function getOrCreateMarket(asset: Address): Market {
  const id = asset.toHexString();
  let market = Market.load(id);
  if (!market) {
    const id = asset.toHexString();
    const inputToken = getOrCreateAssetToken(asset);
    market = new Market(id);
    market.protocol = getOrCreateLendingProtocol().id;
    market.name = inputToken.name;
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = MAXIMUM_LTV;
    market.liquidationThreshold = MAXIMUM_LTV;
    market.liquidationPenalty = LIQUIDATION_FEE_PERCENT;
    market.inputToken = inputToken.id;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.rates = [getOrCreateStableBorrowerInterestRate(id).id];
    market.createdTimestamp = ACTIVE_POOL_CREATED_TIMESTAMP;
    market.createdBlockNumber = ACTIVE_POOL_CREATED_BLOCK;

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;
    market.save();

    addProtocolMarketAssets(market);
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

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
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

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
  let snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    let rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [
        rates[i],
      ]);
      continue;
    }

    // create new snapshot rate
    let snapshotRateId = rates[i].concat("-").concat(timeSuffix);
    let snapshotRate = new InterestRate(snapshotRateId);
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}

export function setMarketVSTDebt(
  event: ethereum.Event,
  asset: Address,
  debtVST: BigInt
): void {
  const debtUSD = bigIntToBigDecimal(debtVST);
  const market = getOrCreateMarket(asset);
  const debtUSDChange = debtUSD.minus(market.totalBorrowBalanceUSD);
  const debtVSTChange = BigInt.fromString(
    debtUSDChange.times(exponentToBigDecimal()).toString().split(".")[0]
  );
  market.totalBorrowBalanceUSD = debtUSD;
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(event, debtUSDChange, debtVSTChange);
}

export function setMarketAssetBalance(
  event: ethereum.Event,
  asset: Address,
  balanceAsset: BigInt
): void {
  const balanceUSD = bigIntToBigDecimal(balanceAsset).times(
    getCurrentAssetPrice(asset)
  );
  const market = getOrCreateMarket(asset);
  const netChangeUSD = balanceUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = balanceUSD;
  market.totalDepositBalanceUSD = balanceUSD;
  market.inputToken = asset.toHexString();
  market.inputTokenBalance = balanceAsset;
  market.inputTokenPriceUSD = getCurrentAssetPrice(asset);
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolUSDLocked(event, netChangeUSD);
}

export function addMarketDepositVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, asset, amountUSD, EventType.Deposit);
}

export function addMarketWithdrawVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, asset, amountUSD, EventType.Withdraw);
}

export function addMarketLiquidateVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, asset, amountUSD, EventType.Liquidate);
}

export function addMarketBorrowVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, asset, amountUSD, EventType.Borrow);
}

export function addMarketRepayVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, asset, amountUSD, EventType.Repay);
}

function addMarketVolume(
  event: ethereum.Event,
  asset: Address,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  const market = getOrCreateMarket(asset);
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);

  switch (eventType) {
    case EventType.Deposit:
      market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
      dailySnapshot.dailyDepositUSD =
        dailySnapshot.dailyDepositUSD.plus(amountUSD);
      hourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      addProtocolDepositVolume(event, amountUSD);
      break;
    case EventType.Borrow:
      market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
      dailySnapshot.dailyBorrowUSD =
        dailySnapshot.dailyBorrowUSD.plus(amountUSD);
      hourlySnapshot.hourlyBorrowUSD =
        hourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      addProtocolBorrowVolume(event, amountUSD);
      break;
    case EventType.Liquidate:
      market.cumulativeLiquidateUSD =
        market.cumulativeLiquidateUSD.plus(amountUSD);
      dailySnapshot.dailyLiquidateUSD =
        dailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      hourlySnapshot.hourlyLiquidateUSD =
        hourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      addProtocolLiquidateVolume(event, amountUSD);
      break;
    case EventType.Withdraw:
      dailySnapshot.dailyWithdrawUSD =
        dailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      hourlySnapshot.hourlyWithdrawUSD =
        hourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      addProtocolWithdrawVolume(event, amountUSD);
      break;
    case EventType.Repay:
      dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(amountUSD);
      hourlySnapshot.hourlyRepayUSD =
        hourlySnapshot.hourlyRepayUSD.plus(amountUSD);
      addProtocolRepayVolume(event, amountUSD);
      break;
    default:
      break;
  }

  market.save();
  dailySnapshot.save();
  hourlySnapshot.save();
}

export function openMarketBorrowerPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.borrowingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function openMarketLenderPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.lendingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function closeMarketPosition(market: Market): void {
  market.openPositionCount -= 1;
  market.closedPositionCount += 1;
  market.save();
  decrementProtocolOpenPositionCount();
}
