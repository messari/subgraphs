import { BigInt, BigDecimal, Address, log } from "@graphprotocol/graph-ts"
import { YieldAggregator , Vault } from "../../generated/schema";
import * as constants from "./../constant";
import {
  Deposit as DepositEvent,
} from "../../generated/ControllerListener/VaultContract"
import { getOrCreateVault } from './../entities/Vault'

export function getOrCreateProtocol(): YieldAggregator {
  const id = constants.PROTOCOL_ID.toHex();
  let protocol = YieldAggregator.load(id);

  if (protocol) {
    return protocol as YieldAggregator;
  }

  protocol = new YieldAggregator(id);

  protocol.name = constants.PROTOCOL_NAME;
  protocol.slug = constants.PROTOCOL_SLUG;
  protocol.network = constants.PROTOCOL_NETWORK;
  protocol.type = constants.PROTOCOL_TYPE;
  protocol.schemaVersion = constants.PROTOCOL_SCHEMA_VERSION;
  protocol.subgraphVersion = constants.PROTOCOL_SUBGRAPH_VERSION;
  protocol.methodologyVersion = constants.PROTOCOL_METHODOLOGY_VERSION;
  protocol.cumulativeUniqueUsers = 0;
  protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
  protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
  //protocol.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
  //protocol._vaultIds = [];
  protocol.save();

  return protocol as YieldAggregator;
}
