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

export class SushiswapV3GnosisConfigurations implements Configurations {
  getNetwork(): string {
    return Network.XDAI;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Bytes {
    return Bytes.fromHexString("0xf78031cbca409f2fb6876bdfdbc1b2df24cf9bef");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xf78031cbca409f2fb6876bdfdbc1b2df24cf9bef")
    );
  }
  getProtocolFeeOnOff(): string {
    return FeeSwitch.ON;
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
    return Bytes.fromHexString("0xe91d153e0b41518a2ce8dd3d7944fa863463a97d"); // WXDAI
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0x2995d1317dcd4f0ab89f4ae60f3f020a4f17c7ce", // SUSHI
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1", // WETH
      "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252", // WBTC
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6", // USDT
      "0x82dfe19164729949fd66da1a37bc70dd6c4746ce", // BAO
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1", // WETH2
      "0x44fa8e6f47987339850636f88629646662444217", // DAI
      "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8", // USDP
      "0x9c58bacc331c9aa871afd802db6379a98e80cedb", // GNO
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6", // USDT
      "0x44fa8e6f47987339850636f88629646662444217", // DAI
      "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8", // USDP
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0xf5e270c0d97f88efb023a161b9fcc5d0c7ad0b70", // USDC/wETH
    ]);
  }
  getUntrackedPairs(): Bytes[] {
    return stringToBytesList([]);
  }
  getUntrackedTokens(): Bytes[] {
    return stringToBytesList([]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("1000");
  }
  getBrokenERC20Tokens(): Bytes[] {
    return stringToBytesList([]);
  }
}
