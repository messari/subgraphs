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

export class SushiswapV3EthereumConfigurations implements Configurations {
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
    return Bytes.fromHexString("0xbaceb8ec6b9355dfc0269c18bac9d6e2bdc29c4f");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xbaceb8ec6b9355dfc0269c18bac9d6e2bdc29c4f")
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
    return Bytes.fromHexString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"); // WETH
  }
  getRewardToken(): Bytes {
    return Bytes.fromHexString("");
  }
  getWhitelistTokens(): Bytes[] {
    return stringToBytesList([
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0x383518188c0c6d7730d91b2c03a03c837814a899", // OHM
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // CDAI
      "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // SUSD
      "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
      "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", // YFI
      "0x8798249c2e607446efb7ad49ec89dd1865ff4272", // XSUSHI
      "0x1456688345527be1f37e9e627da0837d6f08c925", // USDP
      "0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a", // BAC
      "0x2ba592f78db6436527729929aaf6c908497cb200", // CREAM
      "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0", // FXS
      "0xa1faa113cbe53436df28ff0aee54275c13b40975", // ALPHA
      "0xdb0f18081b505a7de20b18ac41856bcb4ba86a1a", // PWING
      "0x04fa0d235c4abf4bcf4787af4cf447de572ef828", // UMA
      "0x3155ba85d5f96b2d030a4966af206230e46849cb", // RUNE
      "0x87d73e916d7057945c9bcd8cdd94e42a6f47f776", // NFTX
      "0xdfe66b14d37c77f4e9b180ceb433d1b164f0281d", // STETH
      "0xad32a8e6220741182940c5abf610bde99e737b2d", // DOUGH
      "0xafce9b78d409bf74980cacf610afb851bf02f257", // LFBTC
      "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // SUSHI
      "0x4d224452801aced8b2f0aebe155379bb5d594381", // APE
      "0x31429d1856ad1377a8a0079410b297e1a9e214c2", // ANGLE
      "0xd533a949740bb3306d119cc777fa900ba034cd52", // CRV
      "0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68", // INV
      "0x46e98ffe40e408ba6412beb670507e083c8b95ff", // PRIMATE
      "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3", // MIM
      "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
      "0xa47c8bf37f92abed4a126bda807a7b7498661acd", // UST
      "0x97bbbc5d96875fb78d2f14b7ff8d7a3a74106f17", // ASTRAFER
      "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
      "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
      "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // SNX
      "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", // YFI
      "0x111111111117dc0aa78b770fa6a738034120c302", // 1INCH
      "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
      "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI
      "0xfe2e637202056d30016725477c5da089ab0a043a", // sETH2
      "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // SNX
      "0x111111111117dc0aa78b770fa6a738034120c302", // 1INCH
      "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", // MATIC
      "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // AAVE
    ]);
  }
  getStableCoins(): Bytes[] {
    return stringToBytesList([
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // SUSD
      "0x1456688345527be1f37e9e627da0837d6f08c925", // USDP
    ]);
  }
  getStableOraclePools(): Bytes[] {
    return stringToBytesList([
      "0x35644fb61afbc458bf92b15add6abc1996be5014", // USDC/wETH
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
}
