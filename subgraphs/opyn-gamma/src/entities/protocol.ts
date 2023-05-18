import { BigDecimal } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { DerivOptProtocol, Option } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  OptionType,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
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

export function updateProtocolUSDLocked(netChangeUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  const totalValueLocked = protocol.totalValueLockedUSD.plus(netChangeUSD);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.save();
}

export function updateProtocolOpenInterest(netChangeUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openInterestUSD = protocol.openInterestUSD.plus(netChangeUSD);
  protocol.save();
}

export function addProtocolMintVolume(amountUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol.save();
}

export function addProtocolCollateralVolume(amountUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeCollateralVolumeUSD =
    protocol.cumulativeCollateralVolumeUSD!.plus(amountUSD);
  protocol.save();
}

export function addProtocolClosedVolume(amountUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeClosedVolumeUSD =
    protocol.cumulativeClosedVolumeUSD.plus(amountUSD);
  protocol.save();
}

export function addProtocolExercisedVolume(amountUSD: BigDecimal): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeExercisedVolumeUSD =
    protocol.cumulativeExercisedVolumeUSD.plus(amountUSD);
  protocol.save();
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

export function incrementProtocolPositionCount(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openPositionCount += 1;
  protocol.contractsTakenCount += 1;
  protocol.save();
}

export function decrementProtocolPositionCount(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.openPositionCount -= 1;
  protocol.closedPositionCount += 1;
  protocol.contractsClosedCount += 1;
  protocol.save();
}

export function incrementProtocolMintedCount(option: Option): void {
  const protocol = getOrCreateOpynProtocol();
  if (option.type == OptionType.CALL) {
    protocol.callsMintedCount += 1;
  } else {
    protocol.putsMintedCount += 1;
  }
  protocol.contractsMintedCount += 1;
  protocol.save();
}

export function incrementProtocolExercisedCount(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.contractsExercisedCount += 1;
  protocol.save();
}
