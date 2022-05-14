import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
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
    return "0x122013fd7dF1C6F636a5bb8f03108E876548b455";
  }
  getRewardToken(): string {
    return "0x29dFce9c22003A4999930382Fd00f9Fd6133Acd1";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x471ece3750da237f93b8e339c536989b8978a438",
      "0x765de816845861e75a25fca122bb6898b8b1282a",
      "0xef4229c8c3250c675f21bcefa42f58efbff6002a",
      "0x88eec49252c8cbc039dcdb394c0c2ba2f1637ea0",
      "0x90ca507a5d4458a4c6c6249d186b6dcb02a5bccd",
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73",
      "0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a", // USDC
      "0x90Ca507a5D4458a4C6C6249d186b6dCb02a5BCCd", // DAI
      "0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x93887e0fa9f6c375b2765a6fe885593f16f077f9", // wETH/USDC
      "0xc77398cfb7b0f7ab42bafc02abc20a69ce8cef7f", // wETH/USDT
      "0xccd9d850ef40f19566cd8df950765e9a1a0b9ef2", // wETH/DAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}