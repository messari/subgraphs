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

export class SpookyswapFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
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
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x152ee697f2e276fa89e96742e9bb9ab1f2e61be3";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x152ee697f2e276fa89e96742e9bb9ab1f2e61be3")
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.20");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.03");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.17");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.2");
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
    return "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
  }
  getRewardToken(): string {
    return "0x841fad6eae12c286d1fd18d1d525dffa75c7effe";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // WFTM
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
      "0x049d68029688eabf473097a2fc38ef61633a3c7a", // fUSDT
      "0x74b23882a30290451a17c44f4f05243b6b58c76d", // WETH
      "0x321162cd933e2be498cd2267a90534a804051b11", // WBTC
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
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
