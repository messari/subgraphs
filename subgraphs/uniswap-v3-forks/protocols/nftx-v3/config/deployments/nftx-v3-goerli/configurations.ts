import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  FeeSwitch,
  Network,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/common/constants";
import { stringToBytesList } from "../../../../../src/common/utils/utils";

export class NftxV3GoerliConfigurations implements Configurations {
  getNetwork(): string {
    return Network.GOERLI;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x8206bf754a12205c52a98d39634393f51f38718f"); // shouldn't these be in the configuration.json?
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x8206bf754a12205c52a98d39634393f51f38718f") // shouldn't these be in the configuration.json?
    );
  }
  getProtocolFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getInitialProtocolFeeProportion(fee: i64): BigDecimal {
    log.warning("getProtocolFeeRatio is not implemented: {}", [fee.toString()]);
    return BIGDECIMAL_ZERO;
  }
  getProtocolFeeProportion(protocolFee: BigInt): BigDecimal {
    return BIGDECIMAL_ONE.div(protocolFee.toBigDecimal());
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): Bytes {
    return Bytes.fromHexString("0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"); // WETH  0x18def0e9754385ec1c91e176585f1eb1fd7265f5<- old Weth
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6", // WETH 0x18def0e9754385ec1c91e176585f1eb1fd7265f5 <- old weth
      "0x11fe4b6ae13d2a6055c8d9cf65c55bac32b5d844", // DAI
      "0x07865c6e87b9f70255377e024ace6630c1eaa37f", // USDC
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x11fe4b6ae13d2a6055c8d9cf65c55bac32b5d844", // DAI
      "0x07865c6e87b9f70255377e024ace6630c1eaa37f", // USDC
      //"0xdac17f958d2ee523a2206206994597c13d831ec7", // Tether mainnet
      //"0x0000000000085d4780b73119b644ae5ecd22b376", // tUSD mainnet
      //"0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI mainnet
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x482cedc7b6f71af4370f4107444f0657a35e07ac", // NEW USDC/WETH POOL
      // 0xf8492c75a6c7477da43dbea5f3bf2dece0b23320 was the DAI/WETH pool used here before.
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("200000");
  }
}
