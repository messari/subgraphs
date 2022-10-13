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

export class UniswapV3MainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
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
    return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return toLowerCase([
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
      "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
      "0x86fadb80d8d2cff3c3680819e4da99c10232ba0f", // EBASE
      "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
      "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
      "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
      "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // SNX
      "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", // YFI
      "0x111111111117dc0aa78b770fa6a738034120c302", // 1INCH
      "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
      "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI
      "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", // MATIC
      "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // AAVE
      "0xfe2e637202056d30016725477c5da089ab0a043a", // sETH2
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCase([
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "0x0000000000085d4780b73119b644ae5ecd22b376",
      "0x956f47f50a910163d8bf957cf5846d573e7f87ca",
      "0x4dd28568d05f09b02220b09c2cb307bfd837cb95",
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCase([
      "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8", // USDC/wETH
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCase([
      "0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248", // Mulan/USDT
      "0xfd9715a9f03678975b2e224c938fae8d481b09b2", // Aurora/wETH
      "0x9663f2ca0454accad3e094448ea6f77443880454", // LUSD/wETH
    ]);
  }
  getUntrackedTokens(): string[] {
    return toLowerCase([
      "0xc7283b66eb1eb5fb86327f08e1b5816b0720212b", // TRIBE - Price issues
      "0x6b4c7a5e3f0b99fcd83e9c089bddd6c7fce5c611", // Million
      "0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5",
      "0x18aaa7115705e8be94bffebde57af9bfc265b998", // Audius
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // Synthetix
      "0x9e46a38f5daabe8683e10793b06749eef7d733d1", // Nectar
      "0xbc396689893d065f41bc2c6ecbee5e0085233447", // Perpetual
      "0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2", // renZEC
      "0x48fb253446873234f2febbf9bdeaa72d9d387f94", // Bancor Governance
      "0xd5cd84d6f044abe314ee7e414d37cae8773ef9d3", // Harmony One
      "0xb05097849bca421a3f51b249ba6cca4af4b97cb9", // Float Protocol
      "0x8686525d6627a25c68de82c228448f43c97999f2", // Lilly Finance
      "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667", // Celer Token
      "0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559", // Eden
      "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3", // Magic Internet Money
      "0x2af1df3ab0ab157e1e2ad8f88a7d04fbea0c7dc6", // Bankless Bed Index
      "0x15b7c0c907e4c6b9adaaaabc300c08991d6cea05", // Gelato Network Token
      "0x4d224452801aced8b2f0aebe155379bb5d594381", // Apecoin
      "0xc581b735a1688071a1746c968e0798d642ede491", // EuroTether
      "0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f", // Staked Olympus
      "0x398aea1c9ceb7de800284bb399a15e0efe5a9ec2", // Escrowed Illuvium
      "0x8c6bf16c273636523c29db7db04396143770f6a0", // MoonRabbit
      "0x4da27a545c0c5b758a6ba100e3a049001de870f5", // Staked AAVE
    ]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("400000");
  }
}
