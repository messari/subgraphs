import { Address, BigDecimal, log } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';

export class UniswapV3OptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
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
    return "0x4200000000000000000000000000000000000006";
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return [
        "0x4200000000000000000000000000000000000006", // WETH
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
        "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // TUSD
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
        "0x68f180fcCe6836688e9084f035309E29Bf0A2095", // wBTC
        "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", // PERP
        "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // LYRA
        "0x61BAADcF22d2565B0F471b291C475db5555e0b76", // AELIN
      ];
  }
  getStableCoins(): string[] {
    return [
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
        "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // TUSD
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
      ];
  }
  getStableOraclePools(): string[] {
    return [
        "0x03aF20bDAaFfB4cC0A521796a223f7D85e2aAc31", // wETH/DAI
        "0xB589969D38CE76D3d7AA319De7133bC9755fD840", // wETH/USDC - 0.30
        "0x85149247691df622eaF1a8Bd0CaFd40BC45154a9", // wETH/USDC - 0.05
      ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [
        "0x296f55f8fb28e498b858d0bcda06d955b2cb3f97", // StargateToken
        "0x2e3d870790dc77a83dd1d18184acc7439a53f475", // Frax
      ];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
}
