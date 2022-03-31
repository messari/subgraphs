import { YieldAggregator } from "../../generated/schema";
import { Network, ProtocolType, PROTOCOL_ID } from "./constants";

export function getOrCreateProtocol(): YieldAggregator {
  let protocol = YieldAggregator.load(PROTOCOL_ID);
  if (!protocol) {
    protocol = new YieldAggregator(PROTOCOL_ID);
    protocol.name = "Tokemak";
    protocol.slug = "tokemak";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.YIELD;
    protocol.vaultIds = new Array<string>();
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.save();
  }
  return protocol;
}
