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

export class SushiswapV3MoonriverConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONRIVER;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x2f255d3f3c0a3726c6c99e74566c4b18e36e3ce6");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x2f255d3f3c0a3726c6c99e74566c4b18e36e3ce6")
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
    return Bytes.fromHexString("0xf50225a84382c74cbdea10b0c176f71fc3de0c4d"); // WMOVR
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xf50225a84382c74cbdea10b0c176f71fc3de0c4d", // WMOVR
      "0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c", // WETH
      "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d", // USDC
      "0xb44a9b6905af7c801311e8f4e76932ee959c663c", // USDT
      "0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844", // DAI
      "0xe6a991ffa8cfe62b0bf6bf72959a3d4f11b2e0f5", // WBTC
      "0x1a93b23281cc1cde4c4741353f3064709a16197d", // FRAX
      "0x0cae51e1032e8461f4806e26332c030e34de3adb", // MIM
      "0xf390830df829cf22c53c8840554b98eafc5dcbc2", // SUSHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d", // USDC
      "0xb44a9b6905af7c801311e8f4e76932ee959c663c", // USDT
      "0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844", // DAI
      "0x1a93b23281cc1cde4c4741353f3064709a16197d", // FRAX
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x1f6568ffe1226ba293e6d7dab116b5825b2412c9", // USDC/wETH
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
