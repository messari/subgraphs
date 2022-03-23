import { dataSource } from '@graphprotocol/graph-ts';
import { YieldAggregator } from '../../generated/schema';
import { PROTOCOL_ID, PROTOCOL_NAME, PROTOCOL_SLUG, PROTOCOL_TYPE } from '../constant';

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
  protocol.network = dataSource.network().toUpperCase();
  protocol.type = PROTOCOL_TYPE;
  protocol.usageMetrics = [];
  protocol.financialMetrics = [];
  protocol.vaults = [];

  return protocol;
}
