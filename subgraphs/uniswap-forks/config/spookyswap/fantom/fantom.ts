import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SpookyswapFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolName(): string {
    return "Spookyswap";
  }
  getProtocolSlug(): string {
    return "spookyswap";
  }
  getFactoryAddress(): string {
    return "0x152ee697f2e276fa89e96742e9bb9ab1f2e61be3";
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString("0x152ee697f2e276fa89e96742e9bb9ab1f2e61be3"));
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("2");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("1.7");
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
    return RewardIntervalType.TIMESTAMP;
  }
  getReferenceToken(): string {
    return "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
  }
  getRewardToken(): string {
    return "0x841fad6eae12c286d1fd18d1d525dffa75c7effe";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // WFTM
      "0x841fad6eae12c286d1fd18d1d525dffa75c7effe", // BOO
      "0xa48d959AE2E88f1dAA7D5F611E01908106dE7598", // xBOO
      "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
      "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
      "0x049d68029688eabf473097a2fc38ef61633a3c7a", // fUSDT
      "0x321162Cd933E2Be498Cd2267a90534A804051b11", // WBTC
      "0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454", // BNB
      "0x74b23882a30290451A17c44f4F05243b6b58C76d", // WETH
      "0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6", // CREAM
      "0xB01E8419d842beebf1b70A7b5f7142abbaf7159D", // COVER
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
      "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
      "0x049d68029688eabf473097a2fc38ef61633a3c7a", // fUSDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xe120ffbda0d14f3bb6d6053e90e63c572a66a428", // FTM/DAI
      "0x5965e53aa80a0bcf1cd6dbdd72e6a9b2aa047410", // fUSDT/FTM
      "0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c", // USDC/FTM
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}
