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
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
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
      "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
      "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
      "0xD74f5255D557944cf7Dd0E45FF521520002D5748", // USDs
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443", // wETH/USDC - 0.05
      "0x17c14D2c404D167802b16C450d3c99F88F2c4F4d", // wETH/USDC - 0.30
      "0xc858A329Bf053BE78D6239C4A4343B8FbD21472b", // wETH/USDT
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList(["0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a"]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
}
