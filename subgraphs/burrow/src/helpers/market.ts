import { BigInt, BigDecimal, near } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  InterestRate,
} from "../../generated/schema";
import {
  BI_ZERO,
  BD_ZERO,
  ADDRESS_ZERO,
  NANOSEC_TO_SEC,
  NANOS_TO_DAY,
  NANOS_TO_HOUR,
  InterestRateSide,
  InterestRateType,
  IntervalType,
} from "../utils/const";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken } from "./token";
import { getOrCreateRate } from "./rates";

export function getOrCreateMarket(id: string): Market {
  let market = Market.load(id);
  if (!market) {
    const token = getOrCreateToken(id);
    const protocol = getOrCreateProtocol();

    market = new Market(id);
    market.protocol = protocol.id;
    market.name = token.name;
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.maximumLTV = BD_ZERO;
    market.liquidationThreshold = BD_ZERO;
    market.liquidationPenalty = BD_ZERO;
    market.inputToken = token.id;
    market.outputToken = ADDRESS_ZERO;

    const supplyRate = new InterestRate(
      InterestRateSide.LENDER.concat("-")
        .concat(InterestRateType.VARIABLE)
        .concat("-")
        .concat(market.id)
    );
    supplyRate.rate = BD_ZERO;
    supplyRate.side = InterestRateSide.LENDER;
    supplyRate.type = InterestRateType.VARIABLE;
    supplyRate.save();

    const borrowRate = new InterestRate(
      InterestRateSide.BORROWER.concat("-")
        .concat(InterestRateType.VARIABLE)
        .concat("-")
        .concat(market.id)
    );
    borrowRate.rate = BD_ZERO;
    borrowRate.side = InterestRateSide.BORROWER;
    borrowRate.type = InterestRateType.VARIABLE;
    borrowRate.save();

    // quants
    market.rates = [supplyRate.id, borrowRate.id];
    market.totalValueLockedUSD = BD_ZERO;
    market.cumulativeSupplySideRevenueUSD = BD_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BD_ZERO;
    market.cumulativeTotalRevenueUSD = BD_ZERO;
    market.totalDepositBalanceUSD = BD_ZERO;
    market.cumulativeDepositUSD = BD_ZERO;
    market.totalBorrowBalanceUSD = BD_ZERO;
    market.cumulativeBorrowUSD = BD_ZERO;
    market.cumulativeLiquidateUSD = BD_ZERO;

    // reward token
    market.rewardTokens = new Array<string>();
    market.rewardTokenEmissionsAmount = new Array<BigInt>();
    market.rewardTokenEmissionsUSD = new Array<BigDecimal>();

    // token balances
    market.inputTokenBalance = BI_ZERO;
    market.inputTokenPriceUSD = BD_ZERO;
    market.outputTokenSupply = BI_ZERO;
    market.outputTokenPriceUSD = BD_ZERO;
    market.exchangeRate = BD_ZERO;

    market.createdTimestamp = BI_ZERO;
    market.createdBlockNumber = BI_ZERO;
    market.positionCount = 0;
    market.openPositionCount = 0;
    market.closedPositionCount = 0;
    market.lendingPositionCount = 0;
    market.borrowingPositionCount = 0;

    market._lastUpdateTimestamp = BI_ZERO;

    market._reserveRatio = BI_ZERO;
    market._targetUtilization = BI_ZERO;
    market._targetUtilizationRate = BI_ZERO;
    market._maxUtilizationRate = BI_ZERO;
    market._volatilityRatio = BI_ZERO;

    market._totalWithrawnHistory = BI_ZERO;
    market._totalDepositedHistory = BI_ZERO;

    market._totalBorrowed = BD_ZERO;
    market._totalDeposited = BD_ZERO;
    market._totalReserved = BD_ZERO;
    market._addedToReserve = BD_ZERO;
    market._totalBorrowedHistory = BI_ZERO;
    market._totalRepaidHistory = BI_ZERO;
    market._utilization = BD_ZERO;

    market.save();
  }
  return market;
}

export function getOrCreateMarketDailySnapshot(
  market: Market,
  receipt: near.ReceiptWithOutcome
): MarketDailySnapshot {
  const dayId = NANOS_TO_DAY(receipt.block.header.timestampNanosec).toString();
  const id = market.id.concat("-").concat(dayId);
  let snapshot = MarketDailySnapshot.load(id);

  // --- if new day ---
  if (!snapshot) {
    snapshot = new MarketDailySnapshot(id);
    snapshot.protocol = getOrCreateProtocol().id;
    snapshot.market = market.id;
    snapshot.dailySupplySideRevenueUSD = BD_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BD_ZERO;
    snapshot.dailyTotalRevenueUSD = BD_ZERO;
    snapshot.dailyDepositUSD = BD_ZERO;
    snapshot.dailyBorrowUSD = BD_ZERO;
    snapshot.dailyLiquidateUSD = BD_ZERO;
    snapshot.dailyWithdrawUSD = BD_ZERO;
    snapshot.dailyRepayUSD = BD_ZERO;
  }

  // supply rate
  const supplyRateMarket = getOrCreateRate(market, InterestRateSide.LENDER);
  const supplyRateToday = getOrCreateRate(
    market,
    InterestRateSide.LENDER,
    IntervalType.DAILY,
    receipt
  );
  supplyRateToday.rate = supplyRateMarket.rate;
  supplyRateToday.save();

  // borrow rate
  const borrowRateMarket = getOrCreateRate(market, InterestRateSide.BORROWER);
  const borrowRateToday = getOrCreateRate(
    market,
    InterestRateSide.BORROWER,
    IntervalType.DAILY,
    receipt
  );
  borrowRateToday.rate = borrowRateMarket.rate;
  borrowRateToday.save();
  snapshot.rates = [supplyRateToday.id, borrowRateToday.id];

  snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
  snapshot.timestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;

  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.save();

  return snapshot;
}

export function getOrCreateMarketHourlySnapshot(
  market: Market,
  receipt: near.ReceiptWithOutcome
): MarketHourlySnapshot {
  const hourId = NANOS_TO_HOUR(
    receipt.block.header.timestampNanosec
  ).toString();
  const id = market.id.concat("-").concat(hourId);
  let snapshot = MarketHourlySnapshot.load(id);

  // --- if new hour ---
  if (!snapshot) {
    snapshot = new MarketHourlySnapshot(id);
    snapshot.protocol = getOrCreateProtocol().id;
    snapshot.market = market.id;
    snapshot.hourlySupplySideRevenueUSD = BD_ZERO;
    snapshot.hourlyProtocolSideRevenueUSD = BD_ZERO;
    snapshot.hourlyTotalRevenueUSD = BD_ZERO;
    snapshot.hourlyDepositUSD = BD_ZERO;
    snapshot.hourlyBorrowUSD = BD_ZERO;
    snapshot.hourlyLiquidateUSD = BD_ZERO;
    snapshot.hourlyWithdrawUSD = BD_ZERO;
    snapshot.hourlyRepayUSD = BD_ZERO;
  }
  snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
  snapshot.timestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );
  // supply rate
  const supplyRateMarket = getOrCreateRate(market, InterestRateSide.LENDER);
  const supplyRateToday = getOrCreateRate(
    market,
    InterestRateSide.LENDER,
    IntervalType.HOURLY,
    receipt
  );
  supplyRateToday.rate = supplyRateMarket.rate;
  supplyRateToday.save();

  // borrow rate
  const borrowRateMarket = getOrCreateRate(market, InterestRateSide.BORROWER);
  const borrowRateToday = getOrCreateRate(
    market,
    InterestRateSide.BORROWER,
    IntervalType.HOURLY,
    receipt
  );
  borrowRateToday.rate = borrowRateMarket.rate;
  borrowRateToday.save();

  snapshot.rates = [supplyRateToday.id, borrowRateToday.id];
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.save();

  return snapshot as MarketHourlySnapshot;
}
