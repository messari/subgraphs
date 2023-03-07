import { NetworkConfigs } from "../../configurations/configure";
import { DerivOptProtocol } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
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
    protocol.network = ProtocolType.OPTION;

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
    protocol.openInterestUSD = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function incrementProtocolUniqueUsers(): void {
  const protocol = getOrCreateOpynProtocol();
  protocol.cumulativeUniqueUsers += 1;
  protocol.save();
}
