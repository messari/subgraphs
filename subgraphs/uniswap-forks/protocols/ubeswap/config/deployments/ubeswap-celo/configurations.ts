import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
  Network,
  PROTOCOL_SCHEMA_VERSION,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../src/common/constants";
import {
  toLowerCase,
  toLowerCaseList,
} from "../../../../../src/common/utils/utils";

export class UbeswapCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }

  getSchemaVersion(): string {
    return PROTOCOL_SCHEMA_VERSION;
  }
  getSubgraphVersion(): string {
    return PROTOCOL_SUBGRAPH_VERSION;
  }
  getMethodologyVersion(): string {
    return PROTOCOL_METHODOLOGY_VERSION;
  }
  getFactoryAddress(): string {
    return "0x62d5b84be28a183abb507e125b384122d2c25fae";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x62d5b84be28a183abb507e125b384122d2c25fae")
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  //Liquidity providers earn a 0.25% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.TIMESTAMP;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0x471ece3750da237f93b8e339c536989b8978a438");
  }
  getRewardToken(): string {
    return toLowerCase("0x00be915b9dcf56a3cbe739d9b9c202ca692409ec");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x471ece3750da237f93b8e339c536989b8978a438", //celo
      "0x7037f7296b2fc7908de7b57a89efaa8319f0c500", // mcelo1
      "0x765de816845861e75a25fca122bb6898b8b1282a", // cusd
      "0xa8d0e6799ff3fd19c6459bf02689ae09c4d78ba7", // mcEUR2
      "0xe273ad7ee11dcfaa87383ad5977ee1504ac07568", // mcEUR2
      "0xd629eb00deced2a080b7ec630ef6ac117e614f1b", // wbtc
      "0x122013fd7df1c6f636a5bb8f03108e876548b455", // weth
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73", // cEUR
      "0x00be915b9dcf56a3cbe739d9b9c202ca692409ec", // ube
      "0x64defa3544c695db8c535d289d843a189aa26b98", // mcUSD1
      "0x918146359264c492bd6934071c6bd31c854edbc3", // mcUSD2
      "0x17700282592d6917f6a73d0bf8accf4d578c131e", // MOO
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x2a3684e9dc20b857375ea04235f2f7edbe818fa7", // USDC
      "0x765de816845861e75a25fca122bb6898b8b1282a", // cusd
      "0x64defa3544c695db8c535d289d843a189aa26b98", // mcUSD1
      "0x918146359264c492bd6934071c6bd31c854edbc3", // mcUSD2
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e", // CELO/CUSD
      "0x684da04524b1a6baf99566d722de94ce989ea722", // USDC/CELO
      "0xb460f9ae1fea4f77107146c1960bb1c978118816", // CELO/mCUSD
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}
