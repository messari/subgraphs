import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
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
    return "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
  }
  getRewardToken(): string {
    return "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
      "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
      "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x905dfcd5649217c42684f23958568e533c711aa3", // wETH/USDC
      "0xcb0e5bfa72bbb4d16ab5aa0c60601c438f04b4ad", // wETH/USDT
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}