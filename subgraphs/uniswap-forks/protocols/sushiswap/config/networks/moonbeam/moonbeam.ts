import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';
import { toLowerCase, toLowerCaseList } from '../../../../../src/common/utils/utils';

export class SushiswapMoonbeamConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONBEAM;
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
    return toLowerCase("0x30D2a9F5FDf90ACe8c17952cbb4eE48a55D916A7");
  }
  getRewardToken(): string {
    return toLowerCase("0x2C78f1b70Ccf63CDEe49F9233e9fAa99D43AA07e");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xacc15dc74880c9944775448304b263d191c6077f",
      "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9",
      "0x1dc78acda13a8bc4408b207c9e48cdbc096d95e0",
      "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594",
      "0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7",
      "0xc234a67a4f840e61ade794be47de455361b52413",
      "0x085416975fe14c2a731a97ec38b9bf8135231f62",
      "0x322e86852e492a7ee17f28a78c663da38fb33bfb"
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9", // USDC
      "0xc234A67a4F840E61adE794be47de455361b52413", // DAI
      "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x6853f323508ba1c33a09c4e956ecb9044cc1a801", // wETH/USDC
      "0x499a09c00911d373fda6c28818d95fa8ca148a60", // wETH/USDT
      "0xa8581e054e239fd7b2fa6db9298b941591f52dbe", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
}
