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

export class SushiswapV3FantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x7770978eed668a3ba661d51a773d3a992fc9ddcb");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x7770978eed668a3ba661d51a773d3a992fc9ddcb")
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
    return Bytes.fromHexString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"); // WFTM
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // WFTM
      "0x74b23882a30290451a17c44f4f05243b6b58c76d", // WETH
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // FUSD
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
      "0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc", // SUSHI
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // FUSD
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x37216637e92ff3fd1aece7f39eb8d71fc2545b9b", // USDC/wETH
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
}
