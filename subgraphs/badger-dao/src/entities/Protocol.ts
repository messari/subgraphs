import { YieldAggregator } from "../../generated/schema";
import { PROTOCOL_ID, PROTOCOL_NAME, PROTOCOL_NETWORK, PROTOCOL_SLUG, PROTOCOL_TYPE } from "../constant";

export function getOrCreateProtocol(): YieldAggregator {
  const id = PROTOCOL_ID.toHex();
  let protocol = YieldAggregator.load(id);

  if (protocol) {
    return protocol;
  }

  protocol = new YieldAggregator(id);

  // TODO: values to verify
  protocol.name = PROTOCOL_NAME;
  protocol.slug = PROTOCOL_SLUG;
  protocol.network = PROTOCOL_NETWORK;
  protocol.type = PROTOCOL_TYPE;
  protocol.save();

  return protocol;
}
