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

export class SushiswapV3ArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x1af415a1eba07a4986a52b6f2e7de7003d82231e");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x1af415a1eba07a4986a52b6f2e7de7003d82231e")
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
    return Bytes.fromHexString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1"); // WETH
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      "0xd4d42f0b6def4ce0383636770ef773390d85c61a", // SUSHI
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // WBTC
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
      "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a", // MIM
      "0x17fc002b466eec40dae837fc4be5c67993ddbd6f", // FRAX
      "0x09ad12552ec45f82be90b38dfe7b06332a680864", // ARBY
      "0x6c2c06790b3e3e3c38e12ee22f8183b37a13ee55", // DPX
      "0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1", // GOHM
      "0x539bde0d7dbd336b79148aa742883198bbf60342", // MAGIC
      "0x912ce59144191c1204e64559fe8253a0e49e6548", // ARB
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
      "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a", // MIM
      "0x17fc002b466eec40dae837fc4be5c67993ddbd6f", // FRAX
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x15e444da5b343c5a0931f5d3e85d158d1efc3d40", // USDC/wETH
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
