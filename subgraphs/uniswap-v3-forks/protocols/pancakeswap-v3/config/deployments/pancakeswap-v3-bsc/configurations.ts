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

export class PancakeV3BSCConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
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
    return Bytes.fromHexString("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"); // wBNB
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // wBNB
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // wETH
      "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x36696169c63e42cd08ce11f5deebbcebae652050", // wBNB/Tether - 0.05
      "0x81a9b5f18179ce2bf8f001b8a634db80771f1824", // wBNB/USDC - 0.05
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
