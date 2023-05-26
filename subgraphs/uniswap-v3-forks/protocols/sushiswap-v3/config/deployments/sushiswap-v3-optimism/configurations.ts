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

export class SushiswapV3OptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x9c6522117e2ed1fe5bdb72bb0ed5e3f2bde7dbe0");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x9c6522117e2ed1fe5bdb72bb0ed5e3f2bde7dbe0")
    );
  }
  getProtocolFeeOnOff(): string {
    return FeeSwitch.ON;
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
    return Bytes.fromHexString("0x4200000000000000000000000000000000000006"); // WETH
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x4200000000000000000000000000000000000006", // WETH
      "0x4200000000000000000000000000000000000042", // OP
      "0x68f180fcce6836688e9084f035309e29bf0a2095", // WBTC
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
      "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", // USDT
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
      "0x7170bd6f5ab1ac44a1ba7a0beb5f3f06c2d4a898", // SUSD
      "0x3eaEb77b03dBc0F6321AE1b72b2E9aDb0F60112B", // SUSHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
      "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", // USDT
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x79e11ef350d7c73925f8d0037c2dd1b8ced41533", // USDC/wETH
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("1000");
  }
}
