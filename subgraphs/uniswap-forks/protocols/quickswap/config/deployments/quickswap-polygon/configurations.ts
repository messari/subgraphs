import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
  Network,
  PROTOCOL_SCHEMA_VERSION,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../src/common/constants";
import {
  toLowerCase,
  toLowerCaseList,
} from "../../../../../src/common/utils/utils";

export class QuickswapMaticConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getSchemaVersion(): string {
    return PROTOCOL_SCHEMA_VERSION;
  }
  getSubgraphVersion(): string {
    return PROTOCOL_SUBGRAPH_VERSION;
  }
  getMethodologyVersion(): string {
    return PROTOCOL_METHODOLOGY_VERSION;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return toLowerCase("0x5757371414417b8c6caad45baef941abc7d3ab32");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0x5757371414417b8c6caad45baef941abc7d3ab32")
      )
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"); // wETH
  }
  getRewardToken(): string {
    return toLowerCase("");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // wETH
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x853ee4b2a13f8a742d64c8f088be7ba2131f670d", // USDC/wETH
      "0x4a35582a710e1f4b2030a3f826da20bfb6703c09", // DAI/wETH
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [
      "0x1518820879bc87d4dfea5664bb1b6c240d20d4f2", // Drop
      "0x26d41380012d698e0a65c0f268cfa8ed0148f6f3", // Flamingo
      "0xb4ebbe7f64cf74320fe64ab679a378eb39a80d49", // FIL
    ];
  }
  getBrokenERC20Tokens(): string[] {
    return ["0x5d76fa95c308fce88d347556785dd1dd44416272"];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}
