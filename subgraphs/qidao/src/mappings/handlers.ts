import { Address, dataSource } from "@graphprotocol/graph-ts";

import {
  createERC20Market,
  getMarket,
  getOrCreateLendingProtocol,
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
  BIGINT_MINUS_ONE,
  MAI_TOKEN_ADDRESS,
  UsageType,
} from "../utils/constants";
import { uppercaseNetwork } from "../utils/strings";

import {
  BorrowToken,
  DepositCollateral,
  ERC20QiStablecoin,
  LiquidateVault,
  OwnershipTransferred,
  PayBackToken,
  WithdrawCollateral,
} from "../../generated/templates/Vault/ERC20QiStablecoin";
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

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const contract = ERC20QiStablecoin.bind(event.address);
  const token = getOrCreateToken(contract.collateral(), event, event.address);
  const borrowToken = getOrCreateToken(
    Address.fromString(
      MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()))
    ),
    event
  );
  const protocol = getOrCreateLendingProtocol(event);

  createERC20Market(protocol, token, borrowToken, event);

  protocol.save();
}

export function handleDepositCollateral(event: DepositCollateral): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

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

export function handleBorrowToken(event: BorrowToken): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

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

export function handlePayBackToken(event: PayBackToken): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const closingFee = event.params.closingFee;
  const from = event.transaction.from;

  const protocol = getOrCreateLendingProtocol(event);
  const market = getMarket(marketId);
  const token = getOrCreateToken(Address.fromString(market.inputToken), event);
  const borrowToken = getOrCreateToken(
    Address.fromString(market._borrowToken),
    event
  );

  createRepay(protocol, market, borrowToken, amount, event);
  updateUsage(protocol, from);
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

export function handleLiquidateVault(event: LiquidateVault): void {
  const marketId = event.address;
  const amount = event.params.collateralLiquidated;
  const debtRepaid = event.params.debtRepaid;
  const closingFee = event.params.closingFee;
  const liquidator = event.params.buyer;
  const liquidatee = event.params.owner;

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

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const marketId = event.address;
  const amount = event.params.amount;
  const from = event.transaction.from;

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
