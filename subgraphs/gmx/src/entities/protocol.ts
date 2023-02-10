import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { DerivPerpProtocol } from "../../generated/schema";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { EventType } from "./event";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  PositionSide,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../utils/constants";

export function getOrCreateProtocol(): DerivPerpProtocol {
  const vaultAddress = NetworkConfigs.getVaultAddress();
  let protocol = DerivPerpProtocol.load(vaultAddress);

  if (!protocol) {
    protocol = new DerivPerpProtocol(vaultAddress);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.PERPETUAL;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeStakeSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueBorrowers = INT_ZERO;
    protocol.cumulativeUniqueLiquidators = INT_ZERO;
    protocol.cumulativeUniqueLiquidatees = INT_ZERO;
    protocol._cumulativeUniqueDepositors = INT_ZERO;

    protocol.openInterestUSD = BIGDECIMAL_ZERO;
    protocol.longPositionCount = INT_ZERO;
    protocol.shortPositionCount = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.closedPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;

    protocol.transactionCount = INT_ZERO;
    protocol.depositCount = INT_ZERO;
    protocol.withdrawCount = INT_ZERO;
    protocol.collateralInCount = INT_ZERO;
    protocol.collateralOutCount = INT_ZERO;
    protocol.borrowCount = INT_ZERO;

    protocol.totalPoolCount = INT_ZERO;

    protocol._cumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
    protocol._cumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
    protocol._cumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;
    protocol._lastSnapshotDayID = INT_ZERO;
    protocol._lastUpdateTimestamp = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function increaseSupplySideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolVolume(
  event: ethereum.Event,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  const protocol = getOrCreateProtocol();
  switch (eventType) {
    case EventType.CollateralIn:
      protocol._cumulativeInflowVolumeUSD =
        protocol._cumulativeInflowVolumeUSD.plus(amountUSD);
      break;
    case EventType.ClosePosition:
      protocol._cumulativeClosedInflowVolumeUSD =
        protocol._cumulativeClosedInflowVolumeUSD.plus(amountUSD);
      break;
    case EventType.CollateralOut:
      protocol._cumulativeOutflowVolumeUSD =
        protocol._cumulativeOutflowVolumeUSD.plus(amountUSD);
      break;
    default:
      break;
  }
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolPremium(
  event: ethereum.Event,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  const protocol = getOrCreateProtocol();
  switch (eventType) {
    case EventType.Deposit:
      protocol.cumulativeDepositPremiumUSD =
        protocol.cumulativeDepositPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalLiquidityPremiumUSD =
        protocol.cumulativeTotalLiquidityPremiumUSD.plus(amountUSD);
      break;
    case EventType.Withdraw:
      protocol.cumulativeWithdrawPremiumUSD =
        protocol.cumulativeWithdrawPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalLiquidityPremiumUSD =
        protocol.cumulativeTotalLiquidityPremiumUSD.plus(amountUSD);
      break;
    case EventType.CollateralIn:
      protocol.cumulativeEntryPremiumUSD =
        protocol.cumulativeEntryPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalPremiumUSD =
        protocol.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;
    case EventType.CollateralOut:
      protocol.cumulativeExitPremiumUSD =
        protocol.cumulativeExitPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalPremiumUSD =
        protocol.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;

    default:
      break;
  }

  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function updateProtocolTVL(
  event: ethereum.Event,
  tvlChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.totalValueLockedUSD =
    protocol.totalValueLockedUSD.plus(tvlChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function updateProtocolOpenInterestUSD(
  event: ethereum.Event,
  openInterestChangeUSD: BigDecimal,
  isIncrease: boolean
): void {
  const protocol = getOrCreateProtocol();
  if (isIncrease) {
    protocol.openInterestUSD = protocol.openInterestUSD.plus(
      openInterestChangeUSD
    );
  } else {
    protocol.openInterestUSD = protocol.openInterestUSD.minus(
      openInterestChangeUSD
    );
  }

  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolEventCount(
  event: ethereum.Event,
  eventType: EventType
): void {
  const protocol = getOrCreateProtocol();
  switch (eventType) {
    case EventType.Deposit:
      protocol.depositCount += INT_ONE;
      break;
    case EventType.Withdraw:
      protocol.withdrawCount += INT_ONE;
      break;
    case EventType.CollateralIn:
      protocol.collateralInCount += INT_ONE;
      protocol.borrowCount += INT_ONE;
      break;
    case EventType.CollateralOut:
      protocol.collateralOutCount += INT_ONE;
      break;
    default:
      break;
  }

  protocol.transactionCount += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueUsers(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueUsers += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueBorrowers(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueBorrowers += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueLiquidators(
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueLiquidators += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueLiquidatees(
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueLiquidatees += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolOpenPositionCount(
  event: ethereum.Event,
  positionSide: string
): void {
  const protocol = getOrCreateProtocol();
  if (PositionSide.LONG == positionSide) {
    protocol.longPositionCount += INT_ONE;
  } else {
    protocol.shortPositionCount += INT_ONE;
  }
  protocol.openPositionCount += INT_ONE;
  protocol.cumulativePositionCount += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function decrementProtocolOpenPositionCount(
  event: ethereum.Event,
  positionSide: string
): void {
  const protocol = getOrCreateProtocol();
  if (PositionSide.LONG == positionSide) {
    protocol.longPositionCount =
      protocol.longPositionCount - INT_ONE >= 0
        ? protocol.longPositionCount - INT_ONE
        : INT_ZERO;
  } else {
    protocol.shortPositionCount =
      protocol.shortPositionCount - INT_ONE >= 0
        ? protocol.shortPositionCount - INT_ONE
        : INT_ZERO;
  }
  protocol.openPositionCount =
    protocol.openPositionCount - INT_ONE >= 0
      ? protocol.openPositionCount - INT_ONE
      : INT_ZERO;
  protocol.closedPositionCount += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolTotalPoolCount(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.totalPoolCount += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolTotalRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolSideRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(amountChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolSupplySideRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(amountChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function increaseProtocolStakeSideRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeStakeSideRevenueUSD =
    protocol.cumulativeStakeSideRevenueUSD.plus(amountChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function updateProtocolSnapshotDayID(snapshotDayID: i32): void {
  const protocol = getOrCreateProtocol();
  protocol._lastSnapshotDayID = snapshotDayID;
  protocol.save();
}
