import { YieldAggregator } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  PROTOCOL_ID,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_NETWORK,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_TYPE,
} from "../constant";

export function getOrCreateProtocol(): YieldAggregator {
  const id = PROTOCOL_ID.toHex();
  let protocol = YieldAggregator.load(id);

  if (protocol) {
    return protocol;
  }

  protocol = new YieldAggregator(id);

  protocol.name = PROTOCOL_NAME;
  protocol.slug = PROTOCOL_SLUG;
  protocol.network = PROTOCOL_NETWORK;
  protocol.type = PROTOCOL_TYPE;
  protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
  protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
  protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
  protocol.totalUniqueUsers = 0;
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.totalVolumeUSD = BIGDECIMAL_ZERO;
  protocol.save();

  return protocol;
}
