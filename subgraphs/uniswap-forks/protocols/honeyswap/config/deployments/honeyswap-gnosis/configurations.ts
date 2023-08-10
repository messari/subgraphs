import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_ONE_THOUSAND,
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

export class HoneyswapGnosisConfigurations implements Configurations {
  getNetwork(): string {
    return Network.GNOSIS;
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
    return "0xa818b4f111ccac7aa31d0bcc0806d64f2e0737d7";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xa818b4f111ccac7aa31d0bcc0806d64f2e0737d7")
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
    return "0x9c58bacc331c9aa871afd802db6379a98e80cedb"; // GNO
  }
  getRewardToken(): string {
    return "0x38fb649ad3d6ba1113be5f57b927053e97fc5bf7"; // xCOMB
  }
  getWhitelistTokens(): string[] {
    return [
      "0x9c58bacc331c9aa871afd802db6379a98e80cedb", // GNO
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1", // WETH
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
      "0x38fb649ad3d6ba1113be5f57b927053e97fc5bf7", // xCOMB
      "0x71850b7e9ee3f13ab46d67167341e4bdc905eef9", // HNY
      "0x21a42669643f45bc0e086b8fc2ed70c23d67509d", // FOX
      "0x4f4f9b8d5b4d0dc10506e5551b0513b61fd59e75", // GIV
      "0x4291f029b9e7acb02d49428458cf6fceac545f81", // WATER
      "0xdd96b45877d0e8361a4ddb732da741e97f3191ff", // BUSD
      "0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2", // LINK
      "0x3a97704a1b25f08aa230ae53b352e2e72ef52843", // AGVE
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0xdd96b45877d0e8361a4ddb732da741e97f3191ff", // BUSD
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x321704900d52f44180068caa73778d5cd60695a6", // GNO-WXDAI
      // "0x9e8e5e4a0900fe4634c02aaf0f130cfb93c53fbc", // xCOMB-WXDAI
      // "0x7bea4af5d425f2d4485bdad1859c88617df31a67", // WETH-WXDAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [
      "0x2f26b15dd4d27d9811a08389a0171a3c8750890e", //Honey/hiveWATER Token LP
      "0x5d32a9baf31a793dba7275f77856a47a0f5d09b3", // Giveth Test GIV Token
      "0x69f79c9ea174d4659b18c7993c7efbbbb58cf068", // Test HNY Token
    ];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
}
