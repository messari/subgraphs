import { Address, BigDecimal, Bytes } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  FeeSwitch,
  Network,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/common/constants";
import { stringToBytesList } from "../../../../../src/common/utils/utils";

export class UniswapV3MaticConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x1f98431c8ad98523631ae4a59f267346ea31f984");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x1f98431c8ad98523631ae4a59f267346ea31f984")
    );
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): Bytes {
    return Bytes.fromHexString("0x7ceb23fd6bc0add59e62ac25578270cff1b9f619");
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // weth
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // dai
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // usdc
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // usdt
      "0xa3fa99a148fa48d14ed51d610c367c61876997f1", // mimatic
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // wbtc
      "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39", // link
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // matic
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // dai
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // usdc
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // usdt
      "0xa3fa99a148fa48d14ed51d610c367c61876997f1", // mimatic
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x45dda9cb7c25131df268515131f647d726f50608", // usdc/weth - 0.05
      "0x0e44ceb592acfc5d3f09d996302eb4c499ff8c10", // usdc/weth - 0.30
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
}
