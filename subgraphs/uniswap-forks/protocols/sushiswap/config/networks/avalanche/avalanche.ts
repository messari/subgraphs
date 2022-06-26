import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';
import { toLowerCase, toLowerCaseList } from '../../../../../src/common/utils/utils';

export class SushiswapAvalancheConfigurations implements Configurations {
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
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return toLowerCase("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  }
  getRewardToken(): string {
    return toLowerCase("0x37B608519F91f70F2EeB0e5Ed9AF4061722e4F76");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wAVAX
      "0xf20d962a6c8f70c731bd838a3a388d7d48fa6e15", // wETH
      "0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab", // wBTC
      "0xde3a24028580884448a5397872046a019649b084", // USDT
      "0xba7deebbfc5fa1100fb055a87773e1e99cd3507a", // DAI
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xba7deebbfc5fa1100fb055a87773e1e99cd3507a", // DAI
      "0xde3a24028580884448a5397872046a019649b084", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x47f1c2a9c9027a10c3b13d1c40dd976c5014339b", // wAVAX/USDT
      "0x034c1b19dab61b5de448efc1e10a2e592725c893", // wAVAX/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
}
