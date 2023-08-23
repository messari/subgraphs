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

export class SushiswapV3PolygonConfigurations implements Configurations {
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
    return Bytes.fromHexString("0x917933899c6a5f8e37f31e19f92cdbff7e8ff0e2");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x917933899c6a5f8e37f31e19f92cdbff7e8ff0e2")
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
    return Bytes.fromHexString("0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"); // WMATIC
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WMATIC
      "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a", // SUSHI
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // WETH
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0xd6df932a45c0f255f85145f286ea0b292b21c90b", // AAVE
      "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89", // FRAX
      "0x2f800db0fdb5223b3c3f354886d907a671414a7f", // BCT
      "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23", // AURUM
      "0xe8377a076adabb3f9838afb77bee96eac101ffb1", // MSU
      "0x61daecab65ee2a1d5b6032df030f3faa3d116aa7", // DMAGIC
      "0xd3f07ea86ddf7baebefd49731d7bbd207fedc53b", // NDEFI
      "0x236eec6359fb44cce8f97e99387aa7f8cd5cde1f", // USDPLUS
      "0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b", // BOB
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89", // FRAX
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x21988c9cfd08db3b5793c2c6782271dc94749251", // USDC/wETH
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
  getBrokenERC20Tokens(): Bytes[] {
    return stringToBytesList([]);
  }
}
