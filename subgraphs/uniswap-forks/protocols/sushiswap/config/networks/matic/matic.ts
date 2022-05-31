import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';
import { toLowerCase, toLowerCaseList } from '../../../../../src/common/utils/utils';

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
    return Factory.bind(Address.fromString(toLowerCase("0xc35DADB65012eC5796536bD9864eD8773aBc74C4")));
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("3");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.5");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("2.5");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("3");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.TIMESTAMP;
  }
  getReferenceToken(): string {
    return toLowerCase("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619");
  }
  getRewardToken(): string {
    return toLowerCase("0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
      "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
      "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
      "0x104592a158490a9228070e0a8e5343b499e125d0",
      "0x2f800db0fdb5223b3c3f354886d907a671414a7f",
      "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89",
      "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23",
      "0xe8377a076adabb3f9838afb77bee96eac101ffb1",
      "0x61daecab65ee2a1d5b6032df030f3faa3d116aa7",
      "0xd3f07ea86ddf7baebefd49731d7bbd207fedc53b"
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // wETH/USDC
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // wETH/USDT
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
}
