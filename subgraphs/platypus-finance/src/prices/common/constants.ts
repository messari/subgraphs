import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { SushiSwapPair__getReservesResult } from "../../../generated/Pool/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_USDC_DECIMALS = BIGINT_TEN.pow(6);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c"), // CURVE_REGISTRY_MAINNET
);

CURVE_REGISTRY_ADDRESS_MAP.set(
  "avalanche",
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c"), // CURVE_REGISTRY_AVAX
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO,
);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<string, TypedMap<string, Address>>();
export const SUSHISWAP_ROUTER_ADDRESSES = new TypedMap<string, Address>();

SUSHISWAP_ROUTER_ADDRESSES.set(
  "routerV2",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"), // SUSHISWAP_ROUTER_V2_AVAX
);

SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "avalanche",
  SUSHISWAP_ROUTER_ADDRESSES, // SUSHISWAP_ROUTER_MAINNET
);








///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS_FORMAT = new TypedMap<string, Address>();
export const WHITELIST_TOKENS_LIST: string[] = ["WETH", "USDT", "DAI", "USDC", "ETH", "WBTC", "EURS", "LINK"];

export const WHITELIST_TOKENS_MAINNET = new TypedMap<string, Address>();
WHITELIST_TOKENS_MAINNET.set("WETH", Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"));
WHITELIST_TOKENS_MAINNET.set("USDT", Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7"));
WHITELIST_TOKENS_MAINNET.set("DAI", Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f"));
WHITELIST_TOKENS_MAINNET.set("USDC", Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"));
WHITELIST_TOKENS_MAINNET.set("ETH", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS_MAINNET.set("WBTC", Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"));
WHITELIST_TOKENS_MAINNET.set("EURS", Address.fromString("0xdB25f211AB05b1c97D595516F45794528a807ad8"));
WHITELIST_TOKENS_MAINNET.set("LINK", Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"));


export const WHITELIST_TOKENS_AVAX = new TypedMap<string, Address>();
WHITELIST_TOKENS_AVAX.set("AVAX", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS_AVAX.set("WAVAX", Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"));
WHITELIST_TOKENS_AVAX.set("sAVAX", Address.fromString("0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE"));
WHITELIST_TOKENS_AVAX.set("USDT.e", Address.fromString("0xc7198437980c041c805a1edcba50c1ce5db95118"));
WHITELIST_TOKENS_AVAX.set("USDC.e", Address.fromString("0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664"));
WHITELIST_TOKENS_AVAX.set("DAI.e", Address.fromString("0xd586e7f844cea2f87f50152665bcbc2c279d8d70"));
WHITELIST_TOKENS_AVAX.set("USDC", Address.fromString("0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"));
WHITELIST_TOKENS_AVAX.set("USDT", Address.fromString("0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7"));
WHITELIST_TOKENS_AVAX.set("FRAX", Address.fromString("0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64"));
WHITELIST_TOKENS_AVAX.set("MIM", Address.fromString("0x130966628846bfd36ff31a822705796e8cb8c18d"));
WHITELIST_TOKENS_AVAX.set("UST", Address.fromString("0xb599c3590F42f8F995ECfa0f85D2980B76862fc1"));
WHITELIST_TOKENS_AVAX.set("WETH.e", Address.fromString("0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab"));
WHITELIST_TOKENS_AVAX.set("WBTC.e", Address.fromString("0x50b7545627a5162f82a992c33b87adc75187b218"));
WHITELIST_TOKENS_AVAX.set("LINK.e", Address.fromString("0x5947bb275c521040051d82396192181b413227a3"));

export const WHITELIST_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
WHITELIST_TOKENS_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);
WHITELIST_TOKENS_MAP.set("avalanche", WHITELIST_TOKENS_AVAX);

WHITELIST_TOKENS_MAP.set("bnb", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("matic", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("fantom", WHITELIST_TOKENS_FORMAT);
