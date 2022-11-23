import { BigDecimal, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
} from "../../generated/schema";
import { EventType } from "./event";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  LendingType,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  PROTOCOL_ID,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
} from "../utils/constants";

export function getOrCreateLendingProtocol(): LendingProtocol {
  const id = PROTOCOL_ID;
  let protocol = LendingProtocol.load(id);
  if (!protocol) {
    protocol = new LendingProtocol(id);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.ISOLATED;

    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueDepositors = INT_ZERO;
    protocol.cumulativeUniqueBorrowers = INT_ZERO;
    protocol.cumulativeUniqueLiquidators = INT_ZERO;
    protocol.cumulativeUniqueLiquidatees = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateFinancialsSnapshot(
  event: ethereum.Event,
  protocol: LendingProtocol
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = protocol.id;

    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;
  return financialsSnapshot;
}

export function addProtocolSideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyProtocolSideRevenueUSD =
    financialsSnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();
}

export function addSupplySideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailySupplySideRevenueUSD =
    financialsSnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();
}

export function addProtocolDepositVolume(
  event: ethereum.Event,
  depositedUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeDepositUSD =
    protocol.cumulativeDepositUSD.plus(depositedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyDepositUSD =
    financialsSnapshot.dailyDepositUSD.plus(depositedUSD);
  financialsSnapshot.save();
}

export function addProtocolVolume(
  event: ethereum.Event,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  const protocol = getOrCreateLendingProtocol();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);

  switch (eventType) {
    case EventType.Deposit:
      protocol.cumulativeDepositUSD =
        protocol.cumulativeDepositUSD.plus(amountUSD);
      financialsSnapshot.dailyDepositUSD =
        financialsSnapshot.dailyDepositUSD.plus(amountUSD);
      break;
    case EventType.Borrow:
      protocol.cumulativeBorrowUSD =
        protocol.cumulativeBorrowUSD.plus(amountUSD);
      financialsSnapshot.dailyBorrowUSD =
        financialsSnapshot.dailyBorrowUSD.plus(amountUSD);
      break;
    case EventType.Liquidate:
      protocol.cumulativeLiquidateUSD =
        protocol.cumulativeLiquidateUSD.plus(amountUSD);
      financialsSnapshot.dailyLiquidateUSD =
        financialsSnapshot.dailyLiquidateUSD.plus(amountUSD);
      break;
    case EventType.Withdraw:
      financialsSnapshot.dailyWithdrawUSD =
        financialsSnapshot.dailyWithdrawUSD.plus(amountUSD);
      break;
    case EventType.Repay:
      financialsSnapshot.dailyRepayUSD =
        financialsSnapshot.dailyRepayUSD.plus(amountUSD);
      break;
    default:
      break;
  }

  protocol.save();
  financialsSnapshot.save();
}

export function updateProtocolTVL(
  event: ethereum.Event,
  tvlChangeUSD: BigDecimal,
  totalDepositBalanceUSDChange: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.totalValueLockedUSD =
    protocol.totalValueLockedUSD.plus(tvlChangeUSD);
  protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(
    totalDepositBalanceUSDChange
  );
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolBorrowBalance(
  event: ethereum.Event,
  bbChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.plus(bbChangeUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function incrementProtocolUniqueUsers(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeUniqueUsers += 1;
  protocol.save();
}

export function incrementProtocolUniqueDepositors(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeUniqueDepositors += 1;
  protocol.save();
}

export function incrementProtocolUniqueBorrowers(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeUniqueBorrowers += 1;
  protocol.save();
}

export function incrementProtocolUniqueLiquidators(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeUniqueLiquidators += 1;
  protocol.save();
}

export function incrementProtocolUniqueLiquidatees(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeUniqueLiquidatees += 1;
  protocol.save();
}

export function incrementProtocolPositionCount(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativePositionCount += 1;
  protocol.openPositionCount += 1;
  protocol.save();
}

export function decrementProtocolOpenPositionCount(): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();
}
