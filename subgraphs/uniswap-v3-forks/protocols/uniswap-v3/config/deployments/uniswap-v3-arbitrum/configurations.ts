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

export class UniswapV3ArbitrumConfigurations implements Configurations {
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
    return Bytes.fromHexString("0x1f98431c8ad98523631ae4a59f267346ea31f984");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x1f98431c8ad98523631ae4a59f267346ea31f984")
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
    return Bytes.fromHexString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1");
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // weth
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // usdc
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // usdt
      "0xd74f5255d557944cf7dd0e45ff521520002d5748", // usds
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // wbtc
      "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a", // gmx
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      "0xd74f5255d557944cf7dd0e45ff521520002d5748", // USDs
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443", // wETH/USDC - 0.05
      "0x17c14d2c404d167802b16c450d3c99f88f2c4f4d", // wETH/USDC - 0.30
      "0xc858a329bf053be78d6239c4a4343b8fbd21472b", // wETH/USDT
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([
      "0x916c1daf79236700eb67e593dc2456890ffba548",
      "0x73e7d8bad2677656c8cfbe6e18a9257c6be2b87f",
      "0x7a6717ceabe536bb9a6bb39182a4cd575d4e222e",
    ]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
  getBrokenERC20Tokens(): Bytes[] {
    return stringToBytesList([
      "0x000000000000b91b6956fead1dda24c66aa6b972",
      "0x0000000000e586517bccb5ec52e70119299d2c9c",
    ]);
  }
}
