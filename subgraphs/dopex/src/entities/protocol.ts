import {
  BigDecimal,
  Bytes,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { DerivOptProtocol } from "../../generated/schema";
import { Versions } from "../versions";
import { EventType } from "./event";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  ProtocolType,
  PROTOCOL_ADDRESS_ARBITRUM,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  Network,
  PROTOCOL_ADDRESS_POLYGON,
} from "../utils/constants";

export function getOrCreateProtocol(): DerivOptProtocol {
  const network = dataSource.network().toUpperCase().replace("-", "_");
  let address = Bytes.fromHexString(PROTOCOL_ADDRESS_ARBITRUM);
  if (network == Network.MATIC) {
    address = Bytes.fromHexString(PROTOCOL_ADDRESS_POLYGON);
  }
  let protocol = DerivOptProtocol.load(address);

  if (!protocol) {
    protocol = new DerivOptProtocol(address);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = network;
    protocol.type = ProtocolType.OPTION;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.openInterestUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeCollateralVolumeUSD = BIGDECIMAL_ZERO;
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

    protocol.callsMintedCount = INT_ZERO;
    protocol.putsMintedCount = INT_ZERO;
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
    protocol.totalPoolCount = INT_ZERO;

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
  sizeUSDDelta: BigDecimal,
  collateralUSDDelta: BigDecimal,
  eventType: EventType
): void {
  const protocol = getOrCreateProtocol();

  if (eventType == EventType.Settle) {
    protocol.cumulativeExercisedVolumeUSD =
      protocol.cumulativeExercisedVolumeUSD.plus(sizeUSDDelta);
    protocol.cumulativeClosedVolumeUSD =
      protocol.cumulativeClosedVolumeUSD.plus(sizeUSDDelta);
  }
  protocol.cumulativeVolumeUSD =
    protocol.cumulativeVolumeUSD.plus(sizeUSDDelta);
  protocol.cumulativeCollateralVolumeUSD =
    protocol.cumulativeCollateralVolumeUSD!.plus(collateralUSDDelta);

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
    case EventType.Purchase:
      protocol.cumulativeEntryPremiumUSD =
        protocol.cumulativeEntryPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalPremiumUSD =
        protocol.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;
    case EventType.Settle:
      protocol.cumulativeExitPremiumUSD =
        protocol.cumulativeExitPremiumUSD.plus(amountUSD);
      protocol.cumulativeTotalPremiumUSD =
        protocol.cumulativeTotalPremiumUSD.plus(amountUSD);
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
  changeUSD: BigDecimal,
  isIncrease: boolean
): void {
  const protocol = getOrCreateProtocol();
  if (isIncrease) {
    protocol.openInterestUSD = protocol.openInterestUSD.plus(changeUSD);
  } else {
    protocol.openInterestUSD = protocol.openInterestUSD.minus(changeUSD);
  }

  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolEventCount(
  event: ethereum.Event,
  eventType: EventType,
  _isPut: boolean
): void {
  const protocol = getOrCreateProtocol();
  switch (eventType) {
    case EventType.Deposit:
      if (_isPut) {
        protocol.putsMintedCount += INT_ONE;
      } else {
        protocol.callsMintedCount += INT_ONE;
      }
      protocol.contractsMintedCount += INT_ONE;
      break;
    case EventType.Withdraw:
      protocol.contractsExpiredCount += INT_ONE;
      protocol.contractsClosedCount += INT_ONE;
      break;
    case EventType.Purchase:
      protocol.contractsTakenCount += INT_ONE;
      break;
    case EventType.Settle:
      protocol.contractsExercisedCount += INT_ONE;
      break;
    default:
      break;
  }

  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueUsers(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueUsers += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueLP(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueLP += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolUniqueTakers(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeUniqueTakers += INT_ONE;
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function updateProtocolOpenPositionCount(
  event: ethereum.Event,
  isIncrease: boolean
): void {
  const protocol = getOrCreateProtocol();
  if (isIncrease) {
    protocol.openPositionCount += INT_ONE;
  } else {
    protocol.openPositionCount -= INT_ONE;
    protocol.closedPositionCount += INT_ONE;
  }
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function incrementProtocolTotalPoolCount(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  protocol.totalPoolCount += INT_ONE;
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
  // Protocol total revenue
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
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
  // Protocol total revenue
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
  protocol._lastUpdateTimestamp = event.block.timestamp;
  protocol.save();
}

export function updateProtocolSnapshotDayID(snapshotDayID: i32): void {
  const protocol = getOrCreateProtocol();
  protocol._lastSnapshotDayID = snapshotDayID;
  protocol.save();
}
