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

export class IguanaDexV3EtherlinkMainnetConfigurations
  implements Configurations
{
  getNetwork(): string {
    return Network.ETHERLINK_MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x093ccbaecb0e0006c8bffca92e9929d117fec583");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x093ccbaecb0e0006c8bffca92e9929d117fec583"),
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
    return Bytes.fromHexString("0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab"); // WXTZ
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xfc24f770f94edbca6d6f885e12d4317320bcb401", // WETH
      "0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab", // WXTZ
      "0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9", // USDC
      "0x2c03058c8afc06713be23e58d2febc8337dbfe6a", // USDT
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9", // USDC
      "0x2c03058c8afc06713be23e58d2febc8337dbfe6a", // USDT
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x508060a01f11d6a2eb774b55aeba95931265e0cc", // USDC/WXTZ - 0.05
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
