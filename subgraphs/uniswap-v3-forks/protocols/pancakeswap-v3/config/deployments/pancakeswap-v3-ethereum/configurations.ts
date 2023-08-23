import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGDECIMAL_TEN_THOUSAND,
  FeeSwitch,
  INT_FIVE_HUNDRED,
  INT_HUNDRED,
  Network,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/common/constants";
import { stringToBytesList } from "../../../../../src/common/utils/utils";

export class PancakeV3EthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865")
    );
  }
  getProtocolFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getInitialProtocolFeeProportion(fee: i64): BigDecimal {
    if (fee == INT_HUNDRED) {
      return BigDecimal.fromString("0.33");
    } else if (fee == INT_FIVE_HUNDRED) {
      return BigDecimal.fromString("0.34");
    }
    return BigDecimal.fromString("0.32");
  }
  getProtocolFeeProportion(protocolFee: BigInt): BigDecimal {
    return protocolFee.toBigDecimal().div(BIGDECIMAL_TEN_THOUSAND);
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): Bytes {
    return Bytes.fromHexString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"); // WETH
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
      "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x1ac1a8feaaea1900c4166deeed0c11cc10669d36", // USDC/wETH - 0.05
      "0x6ca298d2983ab03aa1da7679389d955a4efee15c", // WETH/USDT - 0.05
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("25000");
  }
  getBrokenERC20Tokens(): Bytes[] {
    return stringToBytesList([]);
  }
}
