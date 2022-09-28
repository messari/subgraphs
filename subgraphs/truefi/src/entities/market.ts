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
import { TruefiPool2 } from "../../generated/templates/TruefiPool2/TruefiPool2";
import { ManagedPortfolio } from "../../generated/templates/ManagedPortfolio/ManagedPortfolio";
import {
  BIGDECIMAL_NEGATIVE_ONE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import { bigIntToBigDecimal, exponentToBigDecimal } from "../utils/numbers";
import { amountInUSD, getTokenPrice } from "./price";
import {
  addProtocolBorrowVolume,
  addProtocolDepositVolume,
  addProtocolLiquidateVolume,
  addProtocolRepayVolume,
  addProtocolSideRevenue,
  addProtocolWithdrawVolume,
  addSupplySideRevenue,
  decrementProtocolOpenPositionCount,
  getOrCreateLendingProtocol,
  incrementProtocolPositionCount,
  updateProtocolBorrowBalance,
  updateProtocolTVL,
} from "./protocol";
import { getOrCreateToken, getTokenById } from "./token";
import { incrementProtocolTotalPoolCount } from "./usage";
import { EventType } from "./event";
import { createInterestRates } from "./rate";

export function getMarket(address: Address): Market {
  const id = address.toHexString();
  return Market.load(id)!;
}

export function createMarket(
  event: ethereum.Event,
  reserve: Address,
  tfToken: Address
): void {
  const id = tfToken.toHexString();
  let market = Market.load(id);
  if (!market) {
    const truefiToken = getOrCreateToken(tfToken, reserve.toHexString());
    market = new Market(id);
    market.protocol = getOrCreateLendingProtocol().id;
    market.name = truefiToken.name;
    market.isActive = true;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = true;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.inputToken = getOrCreateToken(reserve).id;
    market.outputToken = truefiToken.id;
    market.rates = [];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market.exchangeRate = BIGDECIMAL_ONE;

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
    incrementProtocolTotalPoolCount(event);
  }
}

export function closeMarket(market: Market): void {
  market.isActive = false;
  market.canUseAsCollateral = false;
  market.canBorrowFrom = false;
  market.save();
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

export function addMarketDepositVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Deposit);
}

export function addMarketWithdrawVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Withdraw);
}

export function addMarketLiquidateVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Liquidate);
}

export function addMarketBorrowVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Borrow);
}

export function addMarketRepayVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Repay);
}

function addMarketVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
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

export function changeMarketBorrowBalance(
  event: ethereum.Event,
  market: Market,
  balanceChange: BigInt,
  isPool: bool
): void {
  let changeUSD = amountInUSD(balanceChange, getTokenById(market.inputToken));
  if (isPool) {
    const poolContract = TruefiPool2.bind(Address.fromString(market.id));
    const tryLoansValue = poolContract.try_loansValue();
    if (!tryLoansValue.reverted) {
      const loansValueUSD = amountInUSD(
        tryLoansValue.value,
        getTokenById(market.inputToken)
      );
      changeUSD = loansValueUSD.minus(market.totalBorrowBalanceUSD);
    }
  } else {
    const portfoliContract = ManagedPortfolio.bind(
      Address.fromString(market.id)
    );
    const tryIlliquidValue = portfoliContract.try_illiquidValue();
    if (!tryIlliquidValue.reverted) {
      const illiquidValueUSD = amountInUSD(
        tryIlliquidValue.value,
        getTokenById(market.inputToken)
      );
      changeUSD = illiquidValueUSD.minus(market.totalBorrowBalanceUSD);
    }
  }

  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(changeUSD);
  if (market.totalBorrowBalanceUSD.lt(BIGDECIMAL_ZERO)) {
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  }
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(event, changeUSD);
}

export function updateMarketRates(
  event: ethereum.Event,
  market: Market,
  borrowerInterestRate: BigDecimal
): void {
  const newRates = createInterestRates(
    market.id,
    borrowerInterestRate,
    event.block.timestamp.toString()
  );
  market.rates = newRates;
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function updateTokenSupply(
  event: ethereum.Event,
  marketAddress: Address,
  isPool: bool
): void {
  const market = getMarket(marketAddress);
  const inputToken = getTokenById(market.inputToken);
  market.inputTokenPriceUSD = getTokenPrice(inputToken);
  updateMarketTVL(event, market, isPool);

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function addMarketSupplySideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addSupplySideRevenue(event, revenueAmountUSD);
}

export function addMarketProtocolSideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addProtocolSideRevenue(event, revenueAmountUSD);
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

function updateMarketTVL(
  event: ethereum.Event,
  market: Market,
  isPool: bool
): void {
  let inputTokenPriceUSD = market.inputTokenPriceUSD;
  let totalValueLockedUSD: BigDecimal = BIGDECIMAL_NEGATIVE_ONE;
  const inputToken = getTokenById(market.inputToken);
  const outputToken = getTokenById(market.outputToken!);
  let marketValue: BigInt = BIGINT_ZERO; // amount of input tokens in native units

  if (isPool) {
    const poolContract = TruefiPool2.bind(Address.fromString(market.id));
    const tryTotalSupply = poolContract.try_totalSupply();
    if (!tryTotalSupply.reverted) {
      market.outputTokenSupply = tryTotalSupply.value;
    }
    const tryPoolValue = poolContract.try_poolValue();
    if (!tryPoolValue.reverted) {
      totalValueLockedUSD = bigIntToBigDecimal(
        tryPoolValue.value,
        inputToken.decimals
      ).times(inputTokenPriceUSD);
      marketValue = tryPoolValue.value;
    }
  } else {
    const portfolioContract = ManagedPortfolio.bind(
      Address.fromString(market.id)
    );
    const tryTotalSupply = portfolioContract.try_totalSupply();
    if (!tryTotalSupply.reverted) {
      market.outputTokenSupply = tryTotalSupply.value;
    }
    const tryPortfolioValue = portfolioContract.try_value();
    if (!tryPortfolioValue.reverted) {
      totalValueLockedUSD = bigIntToBigDecimal(
        tryPortfolioValue.value,
        inputToken.decimals
      ).times(inputTokenPriceUSD);
      marketValue = tryPortfolioValue.value;
    }
  }

  if (totalValueLockedUSD.ge(BIGDECIMAL_ZERO)) {
    const changeUSD = totalValueLockedUSD.minus(market.totalValueLockedUSD);
    updateProtocolTVL(event, changeUSD, changeUSD);
    if (market.outputTokenSupply.gt(BIGINT_ZERO)) {
      market.outputTokenPriceUSD = totalValueLockedUSD.div(
        bigIntToBigDecimal(
          market.outputTokenSupply,
          getTokenById(market.outputToken!).decimals
        )
      );
      market.inputTokenBalance = marketValue;

      // exchange rate = inputTokenBalance / outputTokenSupply
      // ie, normalize to how much inputToken for each outputToken
      market.exchangeRate = market.inputTokenBalance
        .toBigDecimal()
        .div(exponentToBigDecimal(inputToken.decimals))
        .div(
          market.outputTokenSupply
            .toBigDecimal()
            .div(exponentToBigDecimal(outputToken.decimals))
        );
    }

    market.totalValueLockedUSD = totalValueLockedUSD;
    market.totalDepositBalanceUSD = totalValueLockedUSD;
  }

  market.save();
}
