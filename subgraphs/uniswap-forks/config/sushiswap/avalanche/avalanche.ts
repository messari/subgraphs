import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
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
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB";
  }
  getRewardToken(): string {
    return "0x37B608519F91f70F2EeB0e5Ed9AF4061722e4F76";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
      "0x50b7545627a5162f82a992c33b87adc75187b218",
      "0x130966628846bfd36ff31a822705796e8cb8c18d",
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
      "0xc7198437980c041c805a1edcba50c1ce5db95118",
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
      "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76",
      "0xb54f16fb19478766a268f172c9480f8da1a7c9c3",
      "0xce1bffbd5374dac86a2893119683f4911a2f7814"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664", // USDC
      "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", // DAI
      "0xc7198437980c041c805A1EDcbA50c1Ce5db95118", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x4ed65dab34d5fd4b1eb384432027ce47e90e1185", // wETH/USDC
      "0x09657b445df5bf0141e3ef0f5276a329fc01de01", // wETH/USDT
      "0x55cf10bfbc6a9deaeb3c7ec0dd96d3c1179cb948", // wETH/DAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}