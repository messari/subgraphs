import { BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import {
  DerivOptProtocol,
  FinancialsDailySnapshot,
  Option,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  OptionType,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  SECONDS_PER_DAY,
} from "../common/constants";
import { Versions } from "../versions";

export function getOrCreateOpynProtocol(): DerivOptProtocol {
  let protocol = DerivOptProtocol.load(NetworkConfigs.getControllerAddress());
  if (!protocol) {
    protocol = new DerivOptProtocol(NetworkConfigs.getControllerAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.OPTION;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeExercisedVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    protocol.putsMintedCount = INT_ZERO;
    protocol.callsMintedCount = INT_ZERO;
    protocol.contractsMintedCount = INT_ZERO;
    protocol.contractsTakenCount = INT_ZERO;
    protocol.contractsExpiredCount = INT_ZERO;
    protocol.contractsExercisedCount = INT_ZERO;
    protocol.contractsClosedCount = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.closedPositionCount = INT_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueLP = INT_ZERO;
    protocol.cumulativeUniqueTakers = INT_ZERO;
    protocol.openInterestUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function updateProtocolUSDLocked(
  event: ethereum.Event,
  netChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateOpynProtocol();
  const totalValueLocked = protocol.totalValueLockedUSD.plus(netChangeUSD);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolOpenInterest(
  event: ethereum.Event,
  netChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openInterestUSD = protocol.openInterestUSD.plus(netChangeUSD);
  getOrCreateFinancialsSnapshot(event, protocol);
}

export function incrementProtocolUniqueUsers(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeUniqueUsers += 1;
  protocol.save();
}

export function incrementProtocolUniqueLPs(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeUniqueLP += 1;
  protocol.save();
}

export function incrementProtocolUniqueTakers(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeUniqueTakers += 1;
  protocol.save();
}

export function incrementProtocolTotalPoolCount(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.totalPoolCount += 1;
  protocol.save();
}

export function incrementProtocolPositionCount(event: ethereum.Event): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openPositionCount += 1;
  protocol.contractsTakenCount += 1;
  protocol.save();
  const snapshot = getOrCreateFinancialsSnapshot(event, protocol);
  snapshot.dailyContractsTakenCount += 1;
  snapshot.save();
}

export function decrementProtocolPositionCount(event: ethereum.Event): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openPositionCount -= 1;
  protocol.closedPositionCount += 1;
  protocol.contractsClosedCount += 1;
  protocol.save();
  const snapshot = getOrCreateFinancialsSnapshot(event, protocol);
  snapshot.dailyContractsClosedCount += 1;
  snapshot.save();
}

export function incrementProtocolMintedCount(
  event: ethereum.Event,
  option: Option
): void {
  const protocol = getOrCreateOpynProtocol();
  const snapshot = getOrCreateFinancialsSnapshot(event, protocol);
  if (option.type == OptionType.CALL) {
    protocol.callsMintedCount += 1;
    snapshot.callsMintedCount += 1;
    snapshot.dailyCallsMintedCount += 1;
  } else {
    protocol.putsMintedCount += 1;
    snapshot.putsMintedCount += 1;
    snapshot.dailyPutsMintedCount += 1;
  }
  protocol.contractsMintedCount += 1;
  protocol.save();
  snapshot.contractsMintedCount += 1;
  snapshot.dailyContractsMintedCount += 1;
  snapshot.save();
}

export function incrementProtocolTakenCount(event: ethereum.Event): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.contractsTakenCount += 1;
  protocol.save();
  const snapshot = getOrCreateFinancialsSnapshot(event, protocol);
  snapshot.dailyContractsTakenCount += 1;
  snapshot.save();
}

export function incrementProtocolExercisedCount(event: ethereum.Event): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.contractsExercisedCount += 1;
  protocol.save();
  const snapshot = getOrCreateFinancialsSnapshot(event, protocol);
  snapshot.dailyContractsExercisedCount += 1;
  snapshot.save();
}

function getOrCreateFinancialsSnapshot(
  event: ethereum.Event,
  protocol: DerivOptProtocol
): FinancialsDailySnapshot {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromI32(days);
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.days = days;
    financialsSnapshot.protocol = protocol.id;
    financialsSnapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyExercisedVolumeUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyClosedVolumeUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.openInterestUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyEntryPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyExitPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyPutsMintedCount = INT_ZERO;
    financialsSnapshot.dailyCallsMintedCount = INT_ZERO;
    financialsSnapshot.dailyContractsMintedCount = INT_ZERO;
    financialsSnapshot.dailyContractsTakenCount = INT_ZERO;
    financialsSnapshot.dailyContractsExpiredCount = INT_ZERO;
    financialsSnapshot.dailyContractsExercisedCount = INT_ZERO;
    financialsSnapshot.dailyContractsClosedCount = INT_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialsSnapshot.cumulativeExercisedVolumeUSD =
    protocol.cumulativeExercisedVolumeUSD;
  financialsSnapshot.cumulativeClosedVolumeUSD =
    protocol.cumulativeClosedVolumeUSD;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.cumulativeEntryPremiumUSD =
    protocol.cumulativeEntryPremiumUSD;
  financialsSnapshot.cumulativeExitPremiumUSD =
    protocol.cumulativeExitPremiumUSD;
  financialsSnapshot.cumulativeTotalPremiumUSD =
    protocol.cumulativeTotalPremiumUSD;
  financialsSnapshot.cumulativeDepositPremiumUSD =
    protocol.cumulativeDepositPremiumUSD;
  financialsSnapshot.cumulativeWithdrawPremiumUSD =
    protocol.cumulativeWithdrawPremiumUSD;
  financialsSnapshot.cumulativeTotalLiquidityPremiumUSD =
    protocol.cumulativeTotalLiquidityPremiumUSD;

  financialsSnapshot.putsMintedCount = protocol.putsMintedCount;
  financialsSnapshot.callsMintedCount = protocol.callsMintedCount;
  financialsSnapshot.contractsMintedCount = protocol.contractsMintedCount;
  financialsSnapshot.contractsTakenCount = protocol.contractsTakenCount;
  financialsSnapshot.contractsExpiredCount = protocol.contractsExpiredCount;
  financialsSnapshot.contractsExercisedCount = protocol.contractsExercisedCount;
  financialsSnapshot.contractsClosedCount = protocol.contractsClosedCount;
  financialsSnapshot.openPositionCount = protocol.openPositionCount;
  financialsSnapshot.closedPositionCount = protocol.closedPositionCount;
  return financialsSnapshot;
}
