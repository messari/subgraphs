import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapMoonriverConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONRIVER;
  }
  getProtocolName(): string {
    return "Sushiswap";
  }
  getProtocolSlug(): string {
    return "sushiswap";
  }
  getFactoryAddress(): string {
    return "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString("0xc35DADB65012eC5796536bD9864eD8773aBc74C4"));
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
    return "0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C";
  }
  getRewardToken(): string {
    return "0xf390830DF829cf22c53c8840554B98eafC5dCBc2";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c",
      "0xf50225a84382c74cbdea10b0c176f71fc3de0c4d",
      "0xe6a991ffa8cfe62b0bf6bf72959a3d4f11b2e0f5",
      "0x1a93b23281cc1cde4c4741353f3064709a16197d",
      "0xb44a9b6905af7c801311e8f4e76932ee959c663c",
      "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d",
      "0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844",
      "0x0cae51e1032e8461f4806e26332c030e34de3adb"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D", // USDC
      "0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844", // DAI
      "0xB44a9B6905aF7c801311e8F4E76932ee959c663C", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xb1fdb392fcb3886aea012d5ce70d459d2c77ac08", // wETH/USDC
      "0xb0a594e76a876de40a7fda9819e5c4ec6d9fd222", // wETH/USDT
      "0xc6ca9c83c07a7a3a5461c817ea5210723508a9fd", // wETH/DAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}