import { BigDecimal } from '@graphprotocol/graph-ts';
import { FeeSwitch, RewardIntervalType } from '../../../src/common/constants';
import { ConfigurationFields } from '../../configurations/fields';

export const SushiswapBscConfigurations: ConfigurationFields = {
  network: "bsc",
  protocolName: "Sushiswap",
  protocolSlug: "sushiswap",
  factoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  tradingFee: BigDecimal.fromString("3"),
  protocolFeeToOn: BigDecimal.fromString("0.5"),
  lpFeeToOn: BigDecimal.fromString("2.5"),
  protocolFeeToOff: BigDecimal.fromString("0.0"),
  lpFeeToOff: BigDecimal.fromString("3"),
  feeOnOff: FeeSwitch.ON,
  rewardIntervalType: RewardIntervalType.NONE,
  referenceToken: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  rewardToken: "0x947950BcC74888a40Ffa2593C5798F11Fc9124C4",  
  whitelistTokens: [
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
    "0x55d398326f99059ff775485246999027b3197955",
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    "0xf16e81dce15b08f326220742020379b855b87df9"
],
  stableCoins: [
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
    "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", // DAI
    "0x55d398326f99059fF775485246999027B3197955", // USDT
  ],
  stableOraclePools: [
    "0xc7632b7b2d768bbb30a404e13e1de48d1439ec21", // wETH/USDC
    "0x2905817b020fd35d9d09672946362b62766f0d69", // wETH/USDT
    "0xe6cf29055e747e95c058f64423d984546540ede5", // wETH/DAI
],
  untrackedPairs: []
}