import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  FeeSwitch,
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
import { toLowerCase } from "../../../../../src/common/utils/utils";

export class UniswapV3MaticConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
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
    return "0x1F98431c8aD98523631AE4a59f267346ea31F984".toLowerCase();
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        "0x1F98431c8aD98523631AE4a59f267346ea31F984".toLowerCase()
      )
    );
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619".toLowerCase();
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return toLowerCase([
      "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
      "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
      "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1", // miMATIC
      "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC
      "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", // LINK
      "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // MATIC
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCase([
      "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
      "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1", // miMATIC
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCase([
      "0x45dda9cb7c25131df268515131f647d726f50608", // USDC/wETH - 0.05
      "0x0e44ceb592acfc5d3f09d996302eb4c499ff8c10", // USDC/wETH - 0.30
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCase([]);
  }
  getUntrackedTokens(): string[] {
    return toLowerCase([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("100000");
  }
}
