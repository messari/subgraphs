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

export class SushiswapV3BscConfigurations implements Configurations {
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
    return Bytes.fromHexString("0x126555dd55a39328f69400d6ae4f782bd4c34abb");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x126555dd55a39328f69400d6ae4f782bd4c34abb")
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
    return Bytes.fromHexString("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"); // WBNB
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
      "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // WBTC
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
      "0xf16e81dce15b08f326220742020379b855b87df9", // ICE
      "0x986cdf0fd180b40c4d6aeaa01ab740b996d8b782", // SUSHI
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xc0e2792774b2f602f74f6056ed95ab958d253823", // USDC/wETH
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
