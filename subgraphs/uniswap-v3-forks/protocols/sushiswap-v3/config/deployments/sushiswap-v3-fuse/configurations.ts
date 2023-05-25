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

export class SushiswapV3FuseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FUSE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x1b9d177ccdea3c79b6c8f40761fc8dc9d0500eaa");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x1b9d177ccdea3c79b6c8f40761fc8dc9d0500eaa")
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
    return Bytes.fromHexString("0x0be9e53fd7edac9f859882afdda116645287c629"); // WFUSE
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x0be9e53fd7edac9f859882afdda116645287c629", // WFUSE
      "0xa722c13135930332eb3d749b2f0906559d2c5b99", // WETH
      "0x33284f95ccb7b948d9d352e1439561cf83d8d00d", // WBTC
      "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5", // USDC
      "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba", // DAI
      "0xfadbbf8ce7d5b7041be672561bba99f79c532e10", // USDT
      "0x249be57637d8b013ad64785404b24aebae9b098b", // FUSD
      "0x90708b20ccc1eb95a4fa7c8b18fd2c22a0ff9e78", // SUSHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5", // USDC
      "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba", // DAI
      "0xfadbbf8ce7d5b7041be672561bba99f79c532e10", // USDT
      "0x249be57637d8b013ad64785404b24aebae9b098b", // FUSD
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xcd6506bf09d7823fdc40087de61261e432171435", // USDC/wETH
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
