import { Protocol } from "../../generated/schema";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_ID,
  Network,
  ProtocolType,
  BIGDECIMAL_ZERO,
} from "../utils/constants";
import { Versions } from "../versions";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);

  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID);

    // Metadata
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.GENERIC;

    // Quantitative Data
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = null;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}
