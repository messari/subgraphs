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
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", // USDbC
      "0xeb466342c4d449bc9f53a865d5cb90586f405215", // axlUSDC
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // DAI
      "0x4200000000000000000000000000000000000006", // WETH
      "0x8544fe9d190fd7ec52860abbf45088e81ee24a8c", // TOSHI
      "0x27d2decb4bfc9c76f0309b8e88dec3a601fe25a8", // BALD
      "0x0fa70e156cd3b03ac4080bfe55bd8ab50f5bcb98", // YOU
      "0x23ee2343b892b1bb63503a4fabc840e0e2c6810f", // AXL
      "0x22dc834c3ff3e45f484bf24b9b07b851b981900f", // SMUDCAT
      "0xa4220a2b0cb10bf5fdc3b8c3d9e13728f5e7ca56", // MOCHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", // USDbC
      "0xeb466342c4d449bc9f53a865d5cb90586f405215", // axlUSDC
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // DAI
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x7aa3bc844710220272d9e14cb4b4bb067953d8ac", // WETH/axlUSDC
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
