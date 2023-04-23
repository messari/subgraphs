import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
  MINIMUM_LIQUIDITY_THREE_THOUSAND,
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

export class SushiswapCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
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
    return toLowerCase("0xc35dadb65012ec5796536bd9864ed8773abc74c4");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xc35dadb65012ec5796536bd9864ed8773abc74c4")
      )
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
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.3");
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
    return toLowerCase("0x2def4285787d58a2f811af24755a8150622f4361");
  }
  getRewardToken(): string {
    return toLowerCase("0x29dfce9c22003a4999930382fd00f9fd6133acd1");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x471ece3750da237f93b8e339c536989b8978a438", // CELO
      "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD
      "0xef4229c8c3250c675f21bcefa42f58efbff6002a", // USDC
      "0x88eec49252c8cbc039dcdb394c0c2ba2f1637ea0", // USDT
      "0x90ca507a5d4458a4c6c6249d186b6dcb02a5bccd", // DAI
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73", // cEUR
      "0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b", // wBTC
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xef4229c8c3250c675f21bcefa42f58efbff6002a", // USDC
      "0xe4fe50cdd716522a56204352f00aa110f731932d", // DAI
      "0xb020d981420744f6b0fedd22bb67cd37ce18a1d5", // USDT
      "0x765de816845861e75a25fca122bb6898b8b1282a", // Celo Dollar
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xbe6c36f49aac4ee12ca4b23765d9ea901be00683", // wETH/cuSD
      "0x93887e0fa9f6c375b2765a6fe885593f16f077f9", // wETH/USDC
      "0xc77398cfb7b0f7ab42bafc02abc20a69ce8cef7f", // wETH/USDT
      "0x62f6470fbb1b0f8d2b2c7f497e4e12f820c318a6", // wETH/DAI
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
    return MINIMUM_LIQUIDITY_THREE_THOUSAND;
  }
}
