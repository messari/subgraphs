import { Address, BigDecimal, log } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';

export class UniswapV3ArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
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
    return "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString("0x1F98431c8aD98523631AE4a59f267346ea31F984"));
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return [
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
        "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
        "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
        "0xD74f5255D557944cf7Dd0E45FF521520002D5748", // USDs
        "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC
        "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", // GMX
      ];
  }
  getStableCoins(): string[] {
    return [
        "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
        "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
        "0xD74f5255D557944cf7Dd0E45FF521520002D5748", // USDs
      ];
  }
  getStableOraclePools(): string[] {
    return [
        "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443", // wETH/USDC - 0.05
        "0x17c14D2c404D167802b16C450d3c99F88F2c4F4d", // wETH/USDC - 0.30
        "0xc858A329Bf053BE78D6239C4A4343B8FbD21472b", // wETH/USDT
      ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [
        "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a"
    ];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
}
