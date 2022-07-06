import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND,
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

export class SpiritSwapFantomConfigurations implements Configurations {
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
    return toLowerCase("0xEF45d134b73241eDa7703fa787148D9C9F4950b0");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xEF45d134b73241eDa7703fa787148D9C9F4950b0")
      )
    );
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
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");
  }
  getRewardToken(): string {
    return toLowerCase("0x5Cc61A78F164885776AA610fb0FE1257df78E59B");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83", // wFTM
      "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
      "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
      "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xe7E90f5a767406efF87Fdad7EB07ef407922EC1D", // USDC/FTM
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
}
