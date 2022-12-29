import { Protocol } from "../../generated/schema";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  RETH_ADDRESS,
  Network,
  ProtocolType,
  BIGDECIMAL_ZERO,
} from "../utils/constants";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(RETH_ADDRESS);

  if (!protocol) {
    protocol = new Protocol(RETH_ADDRESS);

    // Metadata
    protocol.id = RETH_ADDRESS;
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

  protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
  protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
  protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;

  protocol.save();

  return protocol;
}
