import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  FeeSwitch,
  Network,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/common/constants";
import { stringToBytesList } from "../../../../../src/common/utils/utils";

export class UniswapV3MainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0x1f98431c8ad98523631ae4a59f267346ea31f984"); // shouldn't these be in the configuration.json?
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x1f98431c8ad98523631ae4a59f267346ea31f984") // shouldn't these be in the configuration.json?
    );
  }
  getProtocolFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getInitialProtocolFeeProportion(fee: i64): BigDecimal {
    log.warning("getProtocolFeeRatio is not implemented: {}", [fee.toString()]);
    return BIGDECIMAL_ZERO;
  }
  getProtocolFeeProportion(protocolFee: BigInt): BigDecimal {
    return BIGDECIMAL_ONE.div(protocolFee.toBigDecimal());
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): Bytes {
    return Bytes.fromHexString("0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"); // WETH
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6", // WETH
      "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844", // DAI
      "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // USDC
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844", // DAI
      "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // USDC
      //"0xdac17f958d2ee523a2206206994597c13d831ec7", // Tether mainnet
      //"0x0000000000085d4780b73119b644ae5ecd22b376", // tUSD mainnet
      //"0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI mainnet
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xF8492C75a6C7477dA43dbEa5f3bf2dECE0B23320", // DAI/wETH get the DAI pool that Apoorv created.
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("200000");
  }
}
