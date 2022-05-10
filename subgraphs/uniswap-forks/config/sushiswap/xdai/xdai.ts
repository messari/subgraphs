import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../../../generated/Factory/Factory';
import { FeeSwitch, Network, RewardIntervalType } from '../../../src/common/constants';
import { Configurations } from '../../configurations/interface';

export class SushiswapXdaiConfigurations implements Configurations {
  getNetwork(): string {
    return Network.XDAI;
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
    return "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1";
  }
  getRewardToken(): string {
    return "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
      "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
      "0x82dfe19164729949fd66da1a37bc70dd6c4746ce",
      "0x44fa8e6f47987339850636f88629646662444217",
      "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8"
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // USDC
      "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // DAI
      "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xa227c72a4055a9dc949cae24f54535fe890d3663", // wETH/USDC
      "0x6685c047eab042297e659bfaa7423e94b4a14b9e", // wETH/USDT
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
}