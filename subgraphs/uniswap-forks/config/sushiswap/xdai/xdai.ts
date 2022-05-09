import { BigDecimal } from '@graphprotocol/graph-ts';
import { FeeSwitch, RewardIntervalType } from '../../../src/common/constants';
import { ConfigurationFields } from '../../configurations/fields';

export const SushiswapXdaiConfigurations: ConfigurationFields = {
  network: "xdai",
  protocolName: "Sushiswap",
  protocolSlug: "sushiswap",
  factoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  tradingFee: BigDecimal.fromString("3"),
  protocolFeeToOn: BigDecimal.fromString("0.5"),
  lpFeeToOn: BigDecimal.fromString("2.5"),
  protocolFeeToOff: BigDecimal.fromString("0.0"),
  lpFeeToOff: BigDecimal.fromString("3"),
  feeOnOff: FeeSwitch.ON,
  rewardIntervalType: RewardIntervalType.TIMESTAMP,
  referenceToken: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
  rewardToken: "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE",  
  whitelistTokens: [
    "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
    "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
    "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
    "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
    "0x82dfe19164729949fd66da1a37bc70dd6c4746ce",
    "0x44fa8e6f47987339850636f88629646662444217",
    "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8"
  ],
  stableCoins: [
    "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // USDC
    "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // DAI
    "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", // USDT
  ],
  stableOraclePools: [
    "0xa227c72a4055a9dc949cae24f54535fe890d3663", // wETH/USDC
    "0x6685c047eab042297e659bfaa7423e94b4a14b9e", // wETH/USDT
  ],
  untrackedPairs: []
}
