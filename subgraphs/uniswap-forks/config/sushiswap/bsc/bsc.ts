import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
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
    return "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
  }
  getRewardToken(): string {
    return "0x947950BcC74888a40Ffa2593C5798F11Fc9124C4";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
      "0x55d398326f99059ff775485246999027b3197955",
      "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
      "0xf16e81dce15b08f326220742020379b855b87df9"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
      "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", // DAI
      "0x55d398326f99059fF775485246999027B3197955", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xc7632b7b2d768bbb30a404e13e1de48d1439ec21", // wETH/USDC
      "0x2905817b020fd35d9d09672946362b62766f0d69", // wETH/USDT
      "0xe6cf29055e747e95c058f64423d984546540ede5", // wETH/DAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}