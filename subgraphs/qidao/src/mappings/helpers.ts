import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  getMarket,
  getOrCreateLendingProtocol,
  getOrCreateStableBorrowerInterestRate,
  getOrCreateToken,
} from "../common/getters";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../common/events";
import {
  updateBorrowBalance,
  updateDepositBalance,
  updateRevenue,
  updateUSDValues,
  updateUsage,
} from "../common/metrics";
import { updateMetadata } from "../common/helpers";
import {
  updateMarketHourlySnapshotRevenue,
  updateMarketHourlySnapshotVolume,
  updateMarketDailySnapshotRevenue,
  updateMarketDailySnapshotVolume,
  updateFinancialsDailySnapshotVolume,
  updateFinancialsDailySnapshotRevenue,
  updateUsageMetricsHourlySnapshot,
  updateUsageMetricsDailySnapshot,
} from "../common/snapshot";
import { BIGINT_MINUS_ONE, INT_TWO, UsageType } from "../utils/constants";

import { _InProgressLiquidate } from "../../generated/schema";
import { bigIntToBigDecimal } from "../utils/numbers";

export function helperDepositCollateral(
  marketId: Address,
  amount: BigInt,
  from: Address,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const token = getOrCreateToken(
    Address.fromString(market.inputToken),
    event,
    Address.fromString(market.id)
  );

  createDeposit(protocol, market, token, amount, event);
  updateUsage(protocol, from);
  updateDepositBalance(protocol, market, token, amount, UsageType.DEPOSIT);

  updateMarketHourlySnapshotVolume(
    market,
    token,
    amount,
    UsageType.DEPOSIT,
    event
  );
  updateMarketDailySnapshotVolume(
    market,
    token,
    amount,
    UsageType.DEPOSIT,
    event
  );
  updateFinancialsDailySnapshotVolume(
    protocol,
    token,
    amount,
    UsageType.DEPOSIT,
    event
  );
  updateUsageMetricsHourlySnapshot(protocol, from, UsageType.DEPOSIT, event);
  updateUsageMetricsDailySnapshot(protocol, from, UsageType.DEPOSIT, event);

  market.save();
  protocol.save();

  updateUSDValues(protocol, event);
}

export function helperBorrowToken(
  marketId: Address,
  amount: BigInt,
  from: Address,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const borrowToken = getOrCreateToken(
    Address.fromString(market._borrowToken),
    event
  );

  createBorrow(protocol, market, borrowToken, amount, event);
  updateUsage(protocol, from);
  updateBorrowBalance(protocol, market, borrowToken, amount, UsageType.BORROW);

  updateMarketHourlySnapshotVolume(
    market,
    borrowToken,
    amount,
    UsageType.BORROW,
    event
  );
  updateMarketDailySnapshotVolume(
    market,
    borrowToken,
    amount,
    UsageType.BORROW,
    event
  );
  updateFinancialsDailySnapshotVolume(
    protocol,
    borrowToken,
    amount,
    UsageType.BORROW,
    event
  );
  updateUsageMetricsHourlySnapshot(protocol, from, UsageType.BORROW, event);
  updateUsageMetricsDailySnapshot(protocol, from, UsageType.BORROW, event);

  market.save();
  protocol.save();

  updateUSDValues(protocol, event);
}

export function helperPayBackToken(
  marketId: Address,
  amount: BigInt,
  closingFee: BigInt,
  from: Address,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const token = getOrCreateToken(Address.fromString(market.inputToken), event);
  const borrowToken = getOrCreateToken(
    Address.fromString(market._borrowToken),
    event
  );

  createRepay(protocol, market, borrowToken, amount, event);
  updateUsage(protocol, from);
  // Repayment Fee
  updateRevenue(protocol, market, token, closingFee);
  updateDepositBalance(
    protocol,
    market,
    token,
    closingFee.times(BIGINT_MINUS_ONE),
    UsageType.REPAY
  );
  updateBorrowBalance(
    protocol,
    market,
    borrowToken,
    amount.times(BIGINT_MINUS_ONE),
    UsageType.REPAY
  );

  updateMarketHourlySnapshotVolume(
    market,
    borrowToken,
    amount,
    UsageType.REPAY,
    event
  );
  updateMarketHourlySnapshotRevenue(market, token, closingFee, event);
  updateMarketDailySnapshotVolume(
    market,
    borrowToken,
    amount,
    UsageType.REPAY,
    event
  );
  updateMarketDailySnapshotRevenue(market, token, closingFee, event);
  updateFinancialsDailySnapshotVolume(
    protocol,
    borrowToken,
    amount,
    UsageType.REPAY,
    event
  );
  updateFinancialsDailySnapshotRevenue(protocol, token, closingFee, event);
  updateUsageMetricsHourlySnapshot(protocol, from, UsageType.REPAY, event);
  updateUsageMetricsDailySnapshot(protocol, from, UsageType.REPAY, event);

  market.save();
  protocol.save();

  updateUSDValues(protocol, event);
}

export function helperLiquidateVault(
  marketId: Address,
  amount: BigInt,
  debtRepaid: BigInt,
  closingFee: BigInt,
  liquidator: Address,
  liquidatee: Address,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const token = getOrCreateToken(Address.fromString(market.inputToken), event);
  const borrowToken = getOrCreateToken(
    Address.fromString(market._borrowToken),
    event
  );

  createLiquidate(
    protocol,
    market,
    token,
    borrowToken,
    amount,
    debtRepaid,
    liquidator,
    liquidatee,
    event
  );
  updateUsage(protocol, liquidator);
  // Repayment Fee
  updateRevenue(protocol, market, token, closingFee);
  updateDepositBalance(
    protocol,
    market,
    token,
    closingFee.times(BIGINT_MINUS_ONE),
    UsageType.LIQUIDATE
  );
  updateDepositBalance(
    protocol,
    market,
    token,
    amount.times(BIGINT_MINUS_ONE),
    UsageType.LIQUIDATE
  );
  updateBorrowBalance(
    protocol,
    market,
    borrowToken,
    debtRepaid.times(BIGINT_MINUS_ONE),
    UsageType.LIQUIDATE
  );
  updateMetadata(market);

  updateMarketHourlySnapshotVolume(
    market,
    token,
    amount,
    UsageType.LIQUIDATE,
    event
  );
  updateMarketHourlySnapshotRevenue(market, token, closingFee, event);
  updateMarketDailySnapshotVolume(
    market,
    token,
    amount,
    UsageType.LIQUIDATE,
    event
  );
  updateMarketDailySnapshotRevenue(market, token, closingFee, event);
  updateFinancialsDailySnapshotVolume(
    protocol,
    token,
    amount,
    UsageType.LIQUIDATE,
    event
  );
  updateFinancialsDailySnapshotRevenue(protocol, token, closingFee, event);
  updateUsageMetricsHourlySnapshot(
    protocol,
    liquidator,
    UsageType.LIQUIDATE,
    event
  );
  updateUsageMetricsDailySnapshot(
    protocol,
    liquidator,
    UsageType.LIQUIDATE,
    event
  );

  market.save();
  protocol.save();

  updateUSDValues(protocol, event);
}

export function helperWithdrawCollateral(
  marketId: Address,
  amount: BigInt,
  from: Address,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const token = getOrCreateToken(
    Address.fromString(market.inputToken),
    event,
    Address.fromString(market.id)
  );

  createWithdraw(protocol, market, token, amount, event);
  updateUsage(protocol, from);
  updateDepositBalance(
    protocol,
    market,
    token,
    amount.times(BIGINT_MINUS_ONE),
    UsageType.WITHDRAW
  );

  updateMarketHourlySnapshotVolume(
    market,
    token,
    amount,
    UsageType.WITHDRAW,
    event
  );
  updateMarketDailySnapshotVolume(
    market,
    token,
    amount,
    UsageType.WITHDRAW,
    event
  );
  updateFinancialsDailySnapshotVolume(
    protocol,
    token,
    amount,
    UsageType.WITHDRAW,
    event
  );
  updateUsageMetricsHourlySnapshot(protocol, from, UsageType.WITHDRAW, event);
  updateUsageMetricsDailySnapshot(protocol, from, UsageType.WITHDRAW, event);

  market.save();
  protocol.save();

  updateUSDValues(protocol, event);
}

export function helperUpdatedInterestRate(
  marketId: Address,
  interestRate: BigInt
): void {
  const market = getMarket(marketId);

  const borrowIR = getOrCreateStableBorrowerInterestRate(market.id);
  borrowIR.rate = bigIntToBigDecimal(interestRate, INT_TWO);
  borrowIR.save();

  market.rates = [borrowIR.id];
  market.save();
}
