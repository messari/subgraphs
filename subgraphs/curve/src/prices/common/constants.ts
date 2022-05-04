import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/MainRegistry/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/MainRegistry/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_USDC_DECIMALS = BIGINT_TEN.pow(6);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const BIG_DECIMAL_1E18 = new BigInt(10).pow(18).toBigDecimal();
export const BIG_DECIMAL_1E8 = new BigInt(10).pow(8).toBigDecimal();
export const BIG_DECIMAL_1E6 = new BigInt(10).pow(6).toBigDecimal();

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////
export const CURVE_ADDRESS_PROVIDER_MAINNET = "0x0000000022d53366457f9d5e68ec105046fc4383".toLowerCase();
export const CURVE_REGISTRY_V1_MAINNET = "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c".toLowerCase();

export const CURVE_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x25BF7b72815476Dd515044F9650Bf79bAd0Df655"), // CURVE_REGISTRY_MAINNET
);

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString(CURVE_REGISTRY_V1_MAINNET), // CURVE_REGISTRY_MAINNET
);

export const CURVE_ADDRESS_PROVIDER_MAP = new TypedMap<string, Address>();
CURVE_ADDRESS_PROVIDER_MAP.set(
  "mainnet",
  Address.fromString(CURVE_ADDRESS_PROVIDER_MAINNET), // CURVE_ADDRESS_PROVIDER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO,
);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x8263e161A855B644f582d9C164C66aABEe53f927"), // CALCULATIONS_SUSHISWAP_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESSES = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESSES.set(
  "routerV1",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"), // SUSHISWAP_ROUTER_V1_MAINNET
);
SUSHISWAP_ROUTER_ADDRESSES.set(
  "routerV2",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // SUSHISWAP_ROUTER_V2_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<string, TypedMap<string, Address>>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "mainnet",
  SUSHISWAP_ROUTER_ADDRESSES, // SUSHISWAP_ROUTER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
//////////////////////////// UNISWAP CONTRACT /////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_DEFAULT_RESERVE_CALL = new UniswapPair__getReservesResult(BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO);

export const UNISWAP_CONTRACT_ADDRESSES = new TypedMap<string, Address>();
UNISWAP_CONTRACT_ADDRESSES.set(
  "mainnet",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // UNISWAP_ROUTER_MAINNET
);

export const UNI_V3_FACTORY_ADDRESS = Address.fromString("0x1F98431c8aD98523631AE4a59f267346ea31F984");
export const UNI_V3_QUOTER = Address.fromString("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new Map<string, string>();
YEARN_LENS_CONTRACT_ADDRESS.set(
  "mainnet",
  "0x83d95e0d5f402511db06817aff3f9ea88224b030", // YEARN_LENS_ORACLE_ADDRESS
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_USD_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000348");

export const CHAIN_LINK_CONTRACT_ADDRESS = new Map<string, Address>();
CHAIN_LINK_CONTRACT_ADDRESS.set("mainnet", Address.fromString("0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"));

export const CHAIN_LINK_MANUAL_ADDRESS = new TypedMap<string, TypedMap<string, Address>>();
export const CHAIN_LINK_MANUAL_MAINNET = new TypedMap<string, Address>();
CHAIN_LINK_MANUAL_MAINNET.set("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase(), Address.fromString("0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F".toLowerCase())); // WETH for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599".toLowerCase(), Address.fromString("0xF5fff180082d6017036B771bA883025c654BC935".toLowerCase())); // WBTC for early price sourcing

CHAIN_LINK_MANUAL_ADDRESS.set("mainnet",CHAIN_LINK_MANUAL_MAINNET);


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
WHITELIST_TOKENS_MAINNET.set("3CRV", Address.fromString("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490"));
WHITELIST_TOKENS_MAINNET.set("RKP3R", Address.fromString("0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9"));
WHITELIST_TOKENS_MAINNET.set("CRV", Address.fromString("0xD533a949740bb3306d119CC777fa900bA034cd52"));
export const WHITELIST_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
WHITELIST_TOKENS_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);
WHITELIST_TOKENS_MAP.set("bnb", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("matic", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("fantom", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("avalanche", WHITELIST_TOKENS_FORMAT);

export const CRV_REPLACEMENT_TOKENS_FORMAT = new TypedMap<string, Address>();

export const CRV_REPLACEMENT_TOKENS_MAINNET = new TypedMap<string, Address>();
CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // LINKUSD : LINK
  "0x0E2EC54fC0B509F445631Bf4b91AB8168230C752".toLowerCase(),
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
);
CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // SYNTHLINK : LINK
  "0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6".toLowerCase(),
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
);

export const CRV_REPLACEMENT_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
CRV_REPLACEMENT_TOKENS_MAP.set("mainnet", CRV_REPLACEMENT_TOKENS_MAINNET);
CRV_REPLACEMENT_TOKENS_MAP.set("bnb", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("matic", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("fantom", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("avalanche", CRV_REPLACEMENT_TOKENS_FORMAT);

export const RKP3R_TOKEN = "0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9";
export const RKP3R_ADDRESS = Address.fromString(RKP3R_TOKEN);

export const CVX_CRV_LP_TOKEN = "0x9d0464996170c6b9e75eed71c68b99ddedf279e8";
export const LINK_LP_TOKEN_ADDRESS = Address.fromString("0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a");

export const EURT_TOKEN = "0xC581b735A1688071A1746c968e0798D642EDE491";
export const EURT_ADDRESS = Address.fromString(EURT_TOKEN);

// for Forex and EUR pool, map lp token to Chainlink price feed
export const EURT_LP_TOKEN = "0xfd5db7463a3ab53fd211b4af195c5bccc1a03890";
export const EURS_LP_TOKEN = "0x194ebd173f6cdace046c53eacce9b953f28411d1";
export const EURN_LP_TOKEN = "0x3fb78e61784c9c637d560ede23ad57ca1294c14a";

// Fixed forex proper
export const EUR_LP_TOKEN = "0x19b080fe1ffa0553469d20ca36219f17fcf03859";
export const JPY_LP_TOKEN = "0x8818a9bb44fbf33502be7c15c500d0c783b73067";
export const KRW_LP_TOKEN = "0x8461a004b50d321cb22b7d034969ce6803911899";
export const GBP_LP_TOKEN = "0xd6ac1cb9019137a896343da59dde6d097f710538";
export const AUD_LP_TOKEN = "0x3f1b0278a9ee595635b61817630cc19de792f506";
export const CHF_LP_TOKEN = "0x9c2c8910f113181783c249d8f6aa41b51cde0f0c";

// Mixed USDT-forex (USDT-Forex) pools
export const EURS_USDC_LP_TOKEN = "0x3d229e1b4faab62f621ef2f6a610961f7bd7b23b";
export const EURT_USDT_LP_TOKEN = "0x3b6831c0077a1e44ed0a21841c3bc4dc11bce833";

export const FOREX_ORACLES = new Map<string, Address>();
FOREX_ORACLES.set(EURT_USDT_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURS_USDC_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURT_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURS_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURN_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EUR_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(KRW_LP_TOKEN, Address.fromString("0x01435677FB11763550905594A16B645847C1d0F3"));
FOREX_ORACLES.set(JPY_LP_TOKEN, Address.fromString("0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"));
FOREX_ORACLES.set(GBP_LP_TOKEN, Address.fromString("0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5"));
FOREX_ORACLES.set(AUD_LP_TOKEN, Address.fromString("0x77F9710E7d0A19669A13c055F62cd80d313dF022"));
FOREX_ORACLES.set(CHF_LP_TOKEN, Address.fromString("0x449d117117838fFA61263B61dA6301AA2a88B13A"));

export const STABLECOINS_MAINNET = new Array<string>();
STABLECOINS_MAINNET.push("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".toLowerCase()) // USDC
STABLECOINS_MAINNET.push("0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase()) // DAI
STABLECOINS_MAINNET.push("0xdac17f958d2ee523a2206206994597c13d831ec7".toLowerCase()) // USDT
STABLECOINS_MAINNET.push("0x0000000000085d4780B73119b644AE5ecd22b376".toLowerCase()) // TUSD

export const STABLECOINS_FORMAT = new Array<string>();
export const STABLECOINS_MAP = new TypedMap<string, Array<string>>();


STABLECOINS_MAP.set("mainnet", STABLECOINS_MAINNET);
STABLECOINS_MAP.set("bnb", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("matic", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("fantom", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("avalanche", STABLECOINS_FORMAT);