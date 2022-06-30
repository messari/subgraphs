import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { BIGINT_ZERO, FeeSwitch, MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';

export class ApeswapMaticConfigurations implements Configurations {
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
    return "0xCf083Be4164828f00cAE704EC15a36D711491284";
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString("0xCf083Be4164828f00cAE704EC15a36D711491284"));
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("2");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("1.5");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.5");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("2");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO
  }
  getReferenceToken(): string {
    return "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  }
  getRewardToken(): string {
    return "0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
      "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
      "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2", // WMATIC/DAI
      "0x65d43b64e3b31965cd5ea367d4c2b94c03084797", // WMATIC/USDT
      "0x019011032a7ac3a87ee885b6c08467ac46ad11cd", // WMATIC/USDC
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
}
