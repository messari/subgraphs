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
import { stringToBytesList } from "../../../../../src/common/utils";

export class SushiswapV3BaseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BASE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0xc35dadb65012ec5796536bd9864ed8773abc74c4");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xc35dadb65012ec5796536bd9864ed8773abc74c4")
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
      "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", // USDbC
      "0xEB466342C4d449BC9f53A865D5Cb90586f405215", // axlUSDC
      "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI
      "0x4200000000000000000000000000000000000006", // WETH
      "0x8544FE9D190fD7EC52860abBf45088E81Ee24a8c", // TOSHI
      "0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8", // BALD
      "0x0FA70E156Cd3B03aC4080bfe55BD8AB50f5Bcb98", // YOU
      "0x23ee2343B892b1BB63503a4FAbc840E0e2C6810f", // AXL
      "0x22DC834C3Ff3e45f484bF24B9B07b851B981900f", // SMUDCAT
      "0xa4220a2B0Cb10BF5FDC3B8c3D9E13728f5E7ca56", // MOCHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", // USDbC
      "0xEB466342C4d449BC9f53A865D5Cb90586f405215", // axlUSDC
      "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x7AA3bc844710220272D9e14cB4B4BB067953D8AC", // WETH/axlUSDC
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
