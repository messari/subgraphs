import { TypedMap, Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { RewardIntervalType } from "../../../../../src/common/rewards";

export class MultichainMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xfA9dA51631268A30Ec3DDd1CcBf46c65FAD99251";
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
    token.set("address", "0x65ef703f5594d2573eb71aaf55bc0cb548492df4");
    token.set("name", "Multichain");
    token.set("symbol", "MULTI");
    token.set("decimals", "18");

    return token;
  }
}
