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
import { TornadoCashETH } from "../../../../../generated/TornadoCash01/TornadoCashETH";

export class TornadoCashMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
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
    return "0x8589427373D6D84E98730D7795D8f6f8731FDA16";
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.BLOCK;
  }
  getNativeToken(): TypedMap<string, string> {
    const token = new TypedMap<string, string>();
    token.set("address", "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    token.set("name", "Ether");
    token.set("symbol", "ETH");
    token.set("decimals", "18");

    return token;
  }
  getRewardToken(): TypedMap<string, string> {
    const token = new TypedMap<string, string>();
    token.set("address", "0x77777FeDdddFfC19Ff86DB637967013e6C6A116C");
    token.set("name", "TornadoCash");
    token.set("symbol", "TORN");
    token.set("decimals", "18");

    return token;
  }
  getPoolDenomination(isNativeTokenPool: boolean, poolAddress: string): BigInt {
    if (isNativeTokenPool) {
      let contract = TornadoCashETH.bind(Address.fromString(poolAddress));
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
