import { TypedMap, Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { RewardIntervalType } from "../../../../../src/common/rewards";

import { TornadoCashERC20 } from "../../../../../generated/TornadoCash01/TornadoCashERC20";
import { TornadoCashBNB } from "../../../../../generated/TornadoCash01/TornadoCashBNB";

export class TornadoCashBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getSchemaVersion(): string {
    return PROTOCOL_SCHEMA_VERSION;
  }
  getSubgraphVersion(): string {
    return PROTOCOL_SUBGRAPH_VERSION;
  }
  getMethodologyVersion(): string {
    return PROTOCOL_METHODOLOGY_VERSION;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xce0042B868300000d44A59004Da54A005ffdcf9f";
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.BLOCK;
  }
  getNativeToken(): TypedMap<string, string> {
    const token = new TypedMap<string, string>();
    token.set("address", "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c");
    token.set("name", "BNB");
    token.set("symbol", "BNB");
    token.set("decimals", "18");

    return token;
  }
  getRewardToken(): TypedMap<string, string> {
    const token = new TypedMap<string, string>();
    token.set("address", "0x1ba8d3c4c219b124d351f603060663bd1bcd9bbf");
    token.set("name", "TornadoCash");
    token.set("symbol", "TORN");
    token.set("decimals", "18");

    return token;
  }
  getPoolDenomination(isNativeTokenPool: boolean, poolAddress: string): BigInt {
    if (isNativeTokenPool) {
      let contract = TornadoCashBNB.bind(Address.fromString(poolAddress));
      let denomination_call = contract.try_denomination();

      if (!denomination_call.reverted) {
        return denomination_call.value;
      }
    } else {
      let contract = TornadoCashERC20.bind(Address.fromString(poolAddress));
      let denomination_call = contract.try_denomination();

      if (!denomination_call.reverted) {
        return denomination_call.value;
      }
    }

    return BigInt.fromI32(0);
  }
}
