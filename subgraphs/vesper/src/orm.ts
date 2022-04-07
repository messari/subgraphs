import { YieldAggregator } from "../generated/schema";
import { CONTROLLER_ADDRESS_HEX } from "./constant";
import { Network, ProtocolType } from "../../_reference_/src/common/constants";
import { BigDecimal } from "@graphprotocol/graph-ts";

export function getOrCreateYieldAggregator(): YieldAggregator {
  let obj = YieldAggregator.load(CONTROLLER_ADDRESS_HEX);

  if (!obj) {
    obj = new YieldAggregator(CONTROLLER_ADDRESS_HEX);
    obj.name = "Vesper Finance V3";
    obj.slug = "vesper-finance-v3";
    obj.schemaVersion = "1.0.0";
    obj.subgraphVersion = "1.0.0";
    obj.network = "ETHEREUM";
    obj.type = "YIELD";
    obj.totalUniqueUsers = 0;
    obj.totalValueLockedUSD = BigDecimal.zero();
    obj.save();
  }

  return obj;
}
