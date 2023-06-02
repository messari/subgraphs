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

export class SushiswapV3AvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x3e603c14af37ebdad31709c4f848fc6ad5bec715");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x3e603c14af37ebdad31709c4f848fc6ad5bec715")
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
    return Bytes.fromHexString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"); // WAVAX
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // WAVAX
      "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", // WETH
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // USDC_E
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDTE
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", // DAI
      "0x50b7545627a5162f82a992c33b87adc75187b218", // WBTC
      "0x130966628846bfd36ff31a822705796e8cb8c18d", // MIM
      "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76", // SUSHI
      "0xb54f16fb19478766a268f172c9480f8da1a7c9c3", // TIME
      "0xce1bffbd5374dac86a2893119683f4911a2f7814", // SPELL
      "0x0da67235dd5787d67955420c84ca1cecd4e5bb3b", // WMEMO
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // USDC_E
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDTE
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", // DAI
      "0x130966628846bfd36ff31a822705796e8cb8c18d", // MIM
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x4a5c0e100f830a1f6b76a42e6bb4be2a7fe0d61b", // USDC/wETH
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
