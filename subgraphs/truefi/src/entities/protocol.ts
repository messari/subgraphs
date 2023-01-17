import {
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  RewardToken,
  Token,
} from "../../generated/schema";
import {
  BIGINT_SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  LendingType,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  PROTOCOL_ID,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../utils/constants";
import { Versions } from "../versions";
import { amountInUSDForTru } from "./price";

export function getOrCreateLendingProtocol(): LendingProtocol {
  const id = PROTOCOL_ID;
  let protocol = LendingProtocol.load(id);
  if (!protocol) {
    protocol = new LendingProtocol(id);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.ISOLATED;
    protocol.rewardToken = null;

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
    protocol.rewardTokenEmissionsAmount = BIGINT_ZERO;
    protocol.rewardTokenEmissionsUSD = BIGDECIMAL_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

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

    // For TrueFi, the reward token isn't allocated to markets directly.
    // Lenders needs to stake their tfTokens to get the rewards.
    // So we calculate the rewards at protocol level.
    updateProtocolRewardTokenEmission(event.block.timestamp, protocol);
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialsSnapshot.rewardTokenEmissionsAmount =
    protocol.rewardTokenEmissionsAmount;
  financialsSnapshot.rewardTokenEmissionsUSD = protocol.rewardTokenEmissionsUSD;
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

export function addProtocolBorrowVolume(
  event: ethereum.Event,
  borrowedUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrowedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyBorrowUSD =
    financialsSnapshot.dailyBorrowUSD.plus(borrowedUSD);
  financialsSnapshot.save();
}

export function addProtocolLiquidateVolume(
  event: ethereum.Event,
  liquidatedUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD.plus(liquidatedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyLiquidateUSD =
    financialsSnapshot.dailyLiquidateUSD.plus(liquidatedUSD);
  financialsSnapshot.save();
}

export function addProtocolWithdrawVolume(
  event: ethereum.Event,
  amountUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyWithdrawUSD =
    financialsSnapshot.dailyWithdrawUSD.plus(amountUSD);
  financialsSnapshot.save();
}

export function addProtocolRepayVolume(
  event: ethereum.Event,
  amountUSD: BigDecimal
): void {
  const protocol = getOrCreateLendingProtocol();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyRepayUSD =
    financialsSnapshot.dailyRepayUSD.plus(amountUSD);
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

export function updateProtocolRewardToken(
  timestamp: BigInt,
  rewardToken: RewardToken,
  emissionRate: BigInt
): void {
  const protocol = getOrCreateLendingProtocol();
  protocol.rewardToken = rewardToken.id;
  protocol.rewardTokenEmissionsAmount = emissionRate.times(
    BIGINT_SECONDS_PER_DAY
  );
  protocol.rewardTokenEmissionsUSD = BIGDECIMAL_ZERO;
  protocol.save();
  updateProtocolRewardTokenEmission(timestamp, protocol);
}

function updateProtocolRewardTokenEmission(
  timestamp: BigInt,
  protocol: LendingProtocol
): void {
  if (protocol.rewardToken == null) {
    return;
  }
  const rewardToken = RewardToken.load(protocol.rewardToken!);
  if (rewardToken == null) {
    return;
  }
  let rewardTokenEmission = protocol.rewardTokenEmissionsAmount!;

  if (timestamp.gt(rewardToken.distributionEnd)) {
    rewardTokenEmission = BIGINT_ZERO;
  }

  protocol.rewardTokenEmissionsAmount = rewardTokenEmission;
  protocol.rewardTokenEmissionsUSD = amountInUSDForTru(
    rewardTokenEmission,
    Token.load(rewardToken.token)!
  );
  protocol.save();
}
