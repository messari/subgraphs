import { YieldAggregator } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { YAK_STRATEGY_MANAGER_ADDRESS, ZERO_BIGDECIMAL, ZERO_INT } from "../helpers/constants";

export function initProtocol(contractAddress: Address): YieldAggregator {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let ownerAddress: Address;

  if (yakStrategyV2Contract.try_owner().reverted) {
    ownerAddress = YAK_STRATEGY_MANAGER_ADDRESS;
  } else {
    ownerAddress = yakStrategyV2Contract.owner();
  }

  let protocol = YieldAggregator.load(ownerAddress.toHexString());
  if (protocol == null) {
    protocol = new YieldAggregator(ownerAddress.toHexString());
    protocol.name = "Yield Yak";
    protocol.slug = "yak";
    protocol.schemaVersion = "1.2.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = "AVALANCHE";
    protocol.type = "YIELD";
    protocol.protocolControlledValueUSD = ZERO_BIGDECIMAL;
    protocol.totalValueLockedUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeUniqueUsers = ZERO_INT;
    protocol.totalPoolCount = ZERO_INT;
    protocol.vaults = [];
  }

  return protocol;
}