import { Address } from "@graphprotocol/graph-ts";
import { DexAmmProtocol } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  FACTORY_ADDRESS,
  Network,
  ProtocolType,
} from "./constant";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "apeswap finance";
    protocol.slug = "apeswap-finance";
    protocol.network = Network.BSC;
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;

    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}
