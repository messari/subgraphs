import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "./getters";
import {
  BIGDECIMAL_TWO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  UsageType,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

import {
  ActiveAccount,
  LendingProtocol,
  Market,
  Token,
} from "../../generated/schema";

export function updateMarketHourlySnapshotVolume(
  market: Market,
  token: Token,
  amount: BigInt,
  usageType: string,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateMarketHourlySnapshot(market, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  if (usageType == UsageType.DEPOSIT) {
    snapshot.hourlyDepositUSD = snapshot.hourlyDepositUSD.plus(amountUSD);
  } else if (usageType == UsageType.BORROW) {
    snapshot.hourlyBorrowUSD = snapshot.hourlyBorrowUSD.plus(amountUSD);
  } else if (usageType == UsageType.REPAY) {
    snapshot.hourlyRepayUSD = snapshot.hourlyRepayUSD.plus(amountUSD);
  } else if (usageType == UsageType.LIQUIDATE) {
    snapshot.hourlyLiquidateUSD = snapshot.hourlyLiquidateUSD.plus(amountUSD);
  } else if (usageType == UsageType.WITHDRAW) {
    snapshot.hourlyWithdrawUSD = snapshot.hourlyWithdrawUSD.plus(amountUSD);
  }
  snapshot.save();
}

export function updateMarketHourlySnapshotRevenue(
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateMarketHourlySnapshot(market, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  snapshot.hourlyTotalRevenueUSD =
    snapshot.hourlyTotalRevenueUSD.plus(amountUSD);
  snapshot.hourlySupplySideRevenueUSD =
    snapshot.hourlyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.hourlyProtocolSideRevenueUSD =
    snapshot.hourlyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.save();
}

export function updateMarketDailySnapshotVolume(
  market: Market,
  token: Token,
  amount: BigInt,
  usageType: string,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateMarketDailySnapshot(market, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  if (usageType == UsageType.DEPOSIT) {
    snapshot.dailyDepositUSD = snapshot.dailyDepositUSD.plus(amountUSD);
  } else if (usageType == UsageType.BORROW) {
    snapshot.dailyBorrowUSD = snapshot.dailyBorrowUSD.plus(amountUSD);
  } else if (usageType == UsageType.REPAY) {
    snapshot.dailyRepayUSD = snapshot.dailyRepayUSD.plus(amountUSD);
  } else if (usageType == UsageType.LIQUIDATE) {
    snapshot.dailyLiquidateUSD = snapshot.dailyLiquidateUSD.plus(amountUSD);
  } else if (usageType == UsageType.WITHDRAW) {
    snapshot.dailyWithdrawUSD = snapshot.dailyWithdrawUSD.plus(amountUSD);
  }
  snapshot.save();
}

export function updateMarketDailySnapshotRevenue(
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateMarketDailySnapshot(market, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  snapshot.dailyTotalRevenueUSD = snapshot.dailyTotalRevenueUSD.plus(amountUSD);
  snapshot.dailySupplySideRevenueUSD =
    snapshot.dailyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.dailyProtocolSideRevenueUSD =
    snapshot.dailyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.save();
}

export function updateFinancialsDailySnapshotVolume(
  protocol: LendingProtocol,
  token: Token,
  amount: BigInt,
  usageType: string,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateFinancialsDailySnapshot(protocol, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  if (usageType == UsageType.DEPOSIT) {
    snapshot.dailyDepositUSD = snapshot.dailyDepositUSD.plus(amountUSD);
  } else if (usageType == UsageType.BORROW) {
    snapshot.dailyBorrowUSD = snapshot.dailyBorrowUSD.plus(amountUSD);
  } else if (usageType == UsageType.REPAY) {
    snapshot.dailyRepayUSD = snapshot.dailyRepayUSD.plus(amountUSD);
  } else if (usageType == UsageType.LIQUIDATE) {
    snapshot.dailyLiquidateUSD = snapshot.dailyLiquidateUSD.plus(amountUSD);
  } else if (usageType == UsageType.WITHDRAW) {
    snapshot.dailyWithdrawUSD = snapshot.dailyWithdrawUSD.plus(amountUSD);
  }
  snapshot.save();
}

export function updateFinancialsDailySnapshotRevenue(
  protocol: LendingProtocol,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateFinancialsDailySnapshot(protocol, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  snapshot.dailyTotalRevenueUSD = snapshot.dailyTotalRevenueUSD.plus(amountUSD);
  snapshot.dailySupplySideRevenueUSD =
    snapshot.dailyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.dailyProtocolSideRevenueUSD =
    snapshot.dailyTotalRevenueUSD.div(BIGDECIMAL_TWO);
  snapshot.save();
}

export function updateUsageMetricsHourlySnapshot(
  protocol: LendingProtocol,
  user: Address,
  usageType: string,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateUsageMetricsHourlySnapshot(protocol, event);

  const accountId = user.toHexString();
  const day = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  const hour = `${
    (event.block.timestamp.toI64() % SECONDS_PER_DAY) / SECONDS_PER_HOUR
  }`;
  const activeAccountId = `${accountId}-${day}-${hour}`;
  let activeAccount = ActiveAccount.load(activeAccountId);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(activeAccountId);
    activeAccount.save();
    snapshot.hourlyActiveUsers += 1;
  }

  snapshot.hourlyTransactionCount += 1;
  if (usageType == UsageType.DEPOSIT) {
    snapshot.hourlyDepositCount += 1;
  } else if (usageType == UsageType.BORROW) {
    snapshot.hourlyBorrowCount += 1;
  } else if (usageType == UsageType.REPAY) {
    snapshot.hourlyRepayCount += 1;
  } else if (usageType == UsageType.LIQUIDATE) {
    snapshot.hourlyLiquidateCount += 1;
  } else if (usageType == UsageType.WITHDRAW) {
    snapshot.hourlyWithdrawCount += 1;
  }
  snapshot.save();
}

export function updateUsageMetricsDailySnapshot(
  protocol: LendingProtocol,
  user: Address,
  usageType: string,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateUsageMetricsDailySnapshot(protocol, event);

  const accountId = user.toHexString();
  const day = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  const activeAccountId = `${accountId}-${day}`;
  let activeAccount = ActiveAccount.load(activeAccountId);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(activeAccountId);
    activeAccount.save();
    snapshot.dailyActiveUsers += 1;
  }

  snapshot.dailyTransactionCount += 1;
  if (usageType == UsageType.DEPOSIT) {
    snapshot.dailyDepositCount += 1;
  } else if (usageType == UsageType.BORROW) {
    snapshot.dailyBorrowCount += 1;
  } else if (usageType == UsageType.REPAY) {
    snapshot.dailyRepayCount += 1;
  } else if (usageType == UsageType.LIQUIDATE) {
    snapshot.dailyLiquidateCount += 1;
  } else if (usageType == UsageType.WITHDRAW) {
    snapshot.dailyWithdrawCount += 1;
  }
  snapshot.save();
}
