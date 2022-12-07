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
} from "../utils/const";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken } from "./token";
import { getOrCreateBorrowRate, getOrCreateSupplyRate } from "./rates";

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

    const supplyRate = new InterestRate("SUPPLY-VARIABLE-".concat(id));
    supplyRate.rate = BD_ZERO;
    supplyRate.side = "SUPPLY";
    supplyRate.type = "VARIABLE";

    const borrowRate = new InterestRate("BORROW-VARIABLE-".concat(id));
    borrowRate.rate = BD_ZERO;
    borrowRate.side = "BORROW";
    borrowRate.type = "VARIABLE";

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
    market._reward_remaining_amounts = new Array<BigInt>();
    market.rewardTokenEmissionsAmount = new Array<BigInt>();
    market.rewardTokenEmissionsUSD = new Array<BigDecimal>();

    // token balances
    market.inputTokenBalance = BI_ZERO;
    market.inputTokenPriceUSD = BD_ZERO;
    market.outputTokenSupply = BI_ZERO;
    market.outputTokenPriceUSD = BD_ZERO;
    market.exchangeRate = BD_ZERO;

    market.createdTimestamp = BigInt.fromI32(0);
    market.createdBlockNumber = BigInt.fromI32(0);
    market.positionCount = 0;
    market.openPositionCount = 0;
    market.closedPositionCount = 0;
    market.lendingPositionCount = 0;
    market.borrowingPositionCount = 0;

    market._last_update_timestamp = BigInt.fromI32(0);

    market._reserveRatio = BI_ZERO;
    market._target_utilization = BI_ZERO;
    market._target_utilization_rate = BI_ZERO;
    market._max_utilization_rate = BI_ZERO;
    market._volatility_ratio = BI_ZERO;

    market._totalWithrawnHistory = BI_ZERO;
    market._totalDepositedHistory = BI_ZERO;

    market._totalBorrowed = BD_ZERO;
    market._totalDeposited = BD_ZERO;
    market._totalBorrowedHistory = BI_ZERO;
    market._totalRepaidHistory = BI_ZERO;

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
    snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
    snapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    // supply rate
    const supplyRateMarket = getOrCreateSupplyRate(market);
    const supplyRateToday = getOrCreateSupplyRate(market, receipt);
    supplyRateToday.rate = supplyRateMarket.rate;
    supplyRateToday.save();

    // borrow rate
    const borrowRateMarket = getOrCreateBorrowRate(market);
    const borrowRateToday = getOrCreateBorrowRate(market, receipt);
    borrowRateToday.rate = borrowRateMarket.rate;
    borrowRateToday.save();

    snapshot.rates = [supplyRateToday.id, borrowRateToday.id];
    snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    snapshot.dailySupplySideRevenueUSD = BD_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    snapshot.dailyProtocolSideRevenueUSD = BD_ZERO;
    snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    snapshot.dailyTotalRevenueUSD = BD_ZERO;
    snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    snapshot.dailyDepositUSD = BD_ZERO;
    snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    snapshot.dailyBorrowUSD = BD_ZERO;
    snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    snapshot.dailyLiquidateUSD = BD_ZERO;
    snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    snapshot.dailyWithdrawUSD = BD_ZERO;
    snapshot.dailyRepayUSD = BD_ZERO;
    snapshot.inputTokenBalance = market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
    snapshot.outputTokenSupply = market.outputTokenSupply;
    snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    snapshot.exchangeRate = market.exchangeRate;
    snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  }
  return snapshot as MarketDailySnapshot;
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
    snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
    snapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    // supply rate
    const supplyRateMarket = getOrCreateSupplyRate(market);
    const supplyRateToday = getOrCreateSupplyRate(market, receipt);
    supplyRateToday.rate = supplyRateMarket.rate;
    supplyRateToday.save();

    // borrow rate
    const borrowRateMarket = getOrCreateBorrowRate(market);
    const borrowRateToday = getOrCreateBorrowRate(market, receipt);
    borrowRateToday.rate = borrowRateMarket.rate;
    borrowRateToday.save();

    snapshot.rates = [supplyRateToday.id, borrowRateToday.id];
    snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    snapshot.hourlySupplySideRevenueUSD = BD_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    snapshot.hourlyProtocolSideRevenueUSD = BD_ZERO;
    snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    snapshot.hourlyTotalRevenueUSD = BD_ZERO;
    snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    snapshot.hourlyDepositUSD = BD_ZERO;
    snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    snapshot.hourlyBorrowUSD = BD_ZERO;
    snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    snapshot.hourlyLiquidateUSD = BD_ZERO;
    snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    snapshot.hourlyWithdrawUSD = BD_ZERO;
    snapshot.hourlyRepayUSD = BD_ZERO;
    snapshot.inputTokenBalance = market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
    snapshot.outputTokenSupply = market.outputTokenSupply;
    snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    snapshot.exchangeRate = market.exchangeRate;
    snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  }
  return snapshot as MarketHourlySnapshot;
}
