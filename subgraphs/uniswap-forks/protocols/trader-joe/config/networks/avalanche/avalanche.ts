import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';
import { toLowerCase, toLowerCaseList } from '../../../../../src/common/utils/utils';

export class TraderJoeAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
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
    return toLowerCase("0x9ad6c38be94206ca50bb0d90783181662f0cfa10");
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString(toLowerCase("0x9ad6c38be94206ca50bb0d90783181662f0cfa10")));
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
    return RewardIntervalType.BLOCK;
  }
  getReferenceToken(): string {
    return toLowerCase("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  }
  getRewardToken(): string {
    return toLowerCase("0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wAVAX
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xf4003f4efbe8691b60249e6afbd307abe7758adb", // USDC/wAVAX
      "0xed8cbd9f0ce3c6986b22002f03c6475ceb7a6256"  // USDT/wAVAX
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
}