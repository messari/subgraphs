import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { DexAmmProtocol } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, FACTORY_ADDRESS, Network, ProtocolType } from "./constant";

export function getOrCreateProtocol(): DexAmmProtocol {
    let id = Address.fromString(FACTORY_ADDRESS).toHexString();
    let protocol = DexAmmProtocol.load(id);
    if (!protocol) {
      protocol = new DexAmmProtocol(id);
      protocol.name = "ellipsis finance";
      protocol.slug = "ellipsis-finance";
      protocol.network = Network.BSC;
      protocol.schemaVersion = "1.0.0";
      protocol.subgraphVersion = "1.0.0"
      protocol.type = ProtocolType.EXCHANGE;
      protocol.totalUniqueUsers = 0;
      protocol.totalValueLockedUSD = BIGDECIMAL_ZERO

  
      protocol.save();
  
      return protocol as DexAmmProtocol;
    }
    return protocol as DexAmmProtocol;
  }

export function getCoinCount(poolAddress: Address): BigInt {
    let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    let getCoinCount = factory.try_get_n_coins(poolAddress)
    let coinCount: BigInt = getCoinCount.reverted ? BIGINT_ZERO : getCoinCount.value

    return coinCount
}

export function getCoins(poolAddress: Address): Address[] {
    let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    let getCoinCount = factory.try_get_coins(poolAddress)
    let coins: Address[] = getCoinCount.reverted ? [] : getCoinCount.value

    return coins
}