import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
  MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND,
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

export class SushiswapMaticConfigurations implements Configurations {
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
    return toLowerCase("0xc35DADB65012eC5796536bD9864eD8773aBc74C4");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xc35DADB65012eC5796536bD9864eD8773aBc74C4")
      )
    );
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.TIMESTAMP;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619");
  }
  getRewardToken(): string {
    return toLowerCase("0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // wETH
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // wMatic
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // wBTC
      "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a", // SUSHI
      "0xd6df932a45c0f255f85145f286ea0b292b21c90b", // AAVE
      "0x104592a158490a9228070e0a8e5343b499e125d0", // FRAX POS
      "0x2f800db0fdb5223b3c3f354886d907a671414a7f", // BCT
      "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89", // FRAX
      "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23", // AURUM
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x34965ba0ac2451a34a0471f04cca3f990b8dea27", // wETH/USDC
      "0xc2755915a85c6f6c1c0f3a86ac8c058f11caa9c9", // wETH/USDT
      "0x6ff62bfb8c12109e8000935a6de54dad83a4f39f", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
}
