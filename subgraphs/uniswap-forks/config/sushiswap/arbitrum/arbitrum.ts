import { BigDecimal } from '@graphprotocol/graph-ts';
import { FeeSwitch, RewardIntervalType } from '../../../src/common/constants';
import { ConfigurationFields } from '../../configurations/fields';

export const SushiswapArbitrumConfigurations: ConfigurationFields = {
  network: "arbitrum_one",
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
  referenceToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  rewardToken: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",  
  whitelistTokens: [
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
  ],
  stableCoins: [
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  ],
  stableOraclePools: [
    "0x905dfcd5649217c42684f23958568e533c711aa3", // wETH/USDC
    "0xcb0e5bfa72bbb4d16ab5aa0c60601c438f04b4ad", // wETH/USDT
  ],
  untrackedPairs: []
}
