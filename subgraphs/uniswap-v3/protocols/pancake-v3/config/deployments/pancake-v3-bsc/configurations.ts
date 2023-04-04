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
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
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
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([]);
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
}
